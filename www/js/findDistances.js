/* global app, cordova, $ */

app.findDistances = (function (thisModule) {
  const maximumNumberOfAuthoritiesShownOnResults = 10
  const maximumNumberOfDestinationsForGMapsAPI = 20

  var authoritiesToShow

  $('#refresh-btn').click((e) => {
    $('#authorities_list').empty()
    app.localization.getGeolocation()
  })

  // pre-select 25 authorities based on distances given by coordinates, and
  // then output the 5 closest authorities considering the distances given by google maps (roads)
  function calculateDistancesToAuthorities (latitude, longitude, googleMapsKey) {
    // fetch contacts of police authorities
    app.contactsFunctions.loadPoliceContacts(function (err, contacts) {
      if (err) {
        console.error('error on loadPoliceContacts')
        return
      }

      const authoritiesContacts = contacts // concatenates arrays

      // pre-select authorities based on distances given by coordinates
      const authoritiesContactsLength = authoritiesContacts.length
      for (let i = 0; i < authoritiesContactsLength; i++) {
        authoritiesContacts[i].directDistance = getDistanceFromLatLonInKm(latitude, longitude, parseFloat(authoritiesContacts[i].latitude), parseFloat(authoritiesContacts[i].longitude))
      }

      // sort array of authorities by distance (as crows fly, direct) to destination
      var authoritiesSortedByDirectDistance = authoritiesContacts.sort((a, b) => {
        if (a.directDistance < b.directDistance) {
          return -1
        }
        if (a.directDistance > b.directDistance) {
          return 1
        }
        return 0
      })

      // filter authorities, we just want some types
      var filteredAuthoritiesSortedByDirectDistance = authoritiesSortedByDirectDistance.filter((authority) => {
        return authority.tipo === 'Quartel GNR' || authority.tipo === 'Esquadra de Polícia' || authority.tipo === 'Posto de Polícia'
      })

      var selectedAuthorities = []
      var selectedAuthoritiesCoords = []
      for (let i = 0; i < filteredAuthoritiesSortedByDirectDistance.length && i < maximumNumberOfDestinationsForGMapsAPI; i++) {
        const authority = filteredAuthoritiesSortedByDirectDistance[i]
        selectedAuthorities.push(authority)
        selectedAuthoritiesCoords.push(`${authority.latitude},${authority.longitude}`)
      }

      if (selectedAuthorities.length === 0) {
        showNoResults('Sem resultados relevantes, considerando a sua localização')
        return
      }

      // now gets distances based on google maps (using roads)
      const googleMapsApiDistancesUrl = 'https://maps.googleapis.com/maps/api/distancematrix/json'
      $.get(`${googleMapsApiDistancesUrl}?key=${googleMapsKey}&language=pt-PT&origins=${latitude},${longitude}&destinations=${selectedAuthoritiesCoords.join('|')}`,
        function (result) {
          if (result.rows.length === 0) {
            showNoResults('Sem resultados relevantes, considerando a sua localização')
            return
          }

          var elements = result.rows[0].elements
          for (let i = 0; i < selectedAuthorities.length; i++) {
            selectedAuthorities[i].distance = elements[i].distance
            selectedAuthorities[i].duration = elements[i].duration
            selectedAuthorities[i].status = elements[i].status
          }
          // sort array of authorities by distance (google maps, i.e. roads) to destination
          var authoritiesSortedByRoadDistance = selectedAuthorities.sort((a, b) => {
            if (a.distance.value < b.distance.value) {
              return -1
            }
            if (a.distance.value > b.distance.value) {
              return 1
            }
            return 0
          })

          // remove duplicates
          authoritiesSortedByRoadDistance = authoritiesSortedByRoadDistance.filter((auth, index, self) =>
            index === self.findIndex((t) => (
              t.tipo === auth.tipo && t.telefone === auth.telefone &&
                t.latitude === auth.latitude && t.longitude === auth.longitude
            ))
          )

          showAuthorities(authoritiesSortedByRoadDistance)
        })
    })
  }

  // these are the distances given by google maps, considering roads
  function showAuthorities (authorities) {
    console.log(authorities)
    authoritiesToShow = authorities

    $('#authorities_list').find('*').off() // removes all event handlers
    $('#authorities_list').empty()

    for (let i = 0; i < authorities.length && i < maximumNumberOfAuthoritiesShownOnResults; i++) {
      const authority = authorities[i]
      $('#authorities_list').append(`
        <div class="p-3 border-element authorities_list_element" data-index="${i}">
          <b>${authority.designacao}</b><br>
          <b>Tipo</b>: ${authority.tipo}<br>
          <b>Distância</b>: ${authority.distance.text}<br>
          ${authority.horario ? '<b>Horário</b>: ' + authority.horario + '<br>' : ''}
          <b>Morada</b>: ${authority.morada}, <span style="white-space: nowrap;">${authority.codigopostal} ${authority.localidadepostal}</span><br>
          <b>Telefone</b>: ${authority.telefone}<br>
          ${authority.email.includes('@') ? '<b>E-mail</b>: ' + authority.email + '<br>' : ''}
          <div class="d-flex justify-content-around">
            <button type="button" class="mt-2 btn-authorities-list fa fa-phone btn btn-success phone_authority_btn" data-index="${i}"></button>
            ${authority.email.includes('@') ? `<button type="button" class="mt-2 btn-authorities-list fa fa-envelope btn btn-success send_email_to_authority_btn" data-index="${i}"></button>` : ''}
          </div>
        </div>`
      )
    }

    $('#authorities_list .phone_authority_btn').click(function (event) {
      event.stopPropagation()
      const i = parseInt($(this).data('index'))
      cordova.InAppBrowser.open(`tel:${parseInt(authoritiesToShow[i].telefone)}`, '_system')
    })

    $('#authorities_list .send_email_to_authority_btn').click(function (event) {
      event.stopPropagation()
      const i = parseInt($(this).data('index'))
      console.log('Sending email to: ' + authoritiesToShow[i].email)
      cordova.InAppBrowser.open(`mailto:${authoritiesToShow[i].email}`, '_system')
    })
  }

  function showNoResults (message) {
    $('#authorities_list').find('*').off() // removes all event handlers
    $('#authorities_list').empty()
    $('#authorities_list').append(`<center>${message}</center>`)
  }

  // straight line distance as crows fly https://en.wikipedia.org/wiki/Haversine_formula
  function getDistanceFromLatLonInKm (lat1, lon1, lat2, lon2) {
    var R = 6371 // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1) // deg2rad below
    var dLon = deg2rad(lon2 - lon1)
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)

    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    var d = R * c // Distance in km
    return d
  }

  function deg2rad (deg) {
    return deg * (Math.PI / 180)
  }

  thisModule.calculateDistancesToAuthorities = calculateDistancesToAuthorities

  return thisModule
})(app.findDistances || {})
