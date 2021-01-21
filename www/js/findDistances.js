/* global app, $, google */

app.findDistances = (function (thisModule) {
  $('#refresh-authorities').click((e) => {
    $('#authorities_list').empty()
    const googleMapsKey = app.localization.getGoogleMapsKey()
    const coordinates = app.localization.getCoordinates()
    const latitude = coordinates.latitude
    const longitude = coordinates.longitude
    calculateDistancesToAuthorities(latitude, longitude, googleMapsKey)
  })

  function calculateDistancesToAuthorities (latitude, longitude, googleMapsKey) {
    // fetch contacts of police authorities
    app.contactsFunctions.loadPoliceContacts(function (err, contacts) {
      if (err) {
        console.error('error on loadPoliceContacts')
        return
      }

      const contactsGNR = contacts.contactsGNR
      const contactsPSP = contacts.contactsPSP
      const authoritiesContacts = contactsGNR.concat(contactsPSP) // concatenates arrays

      /* checks the addresses (text) obtained from google maps API and device geocoordinates
         to get a list of pre selected authorities based on their city addresses */
      var selectedAuthorities = []
      var selectedAuthoritiesCoords = []
      var reverseGeocoder = new google.maps.Geocoder()
      var currentPosition = new google.maps.LatLng(latitude, longitude)
      reverseGeocoder.geocode({ latLng: currentPosition }, function (addresses, status) {
        if (status === google.maps.GeocoderStatus.OK && addresses[0]) {
          for (const contact of authoritiesContacts) {
            if (contact.tipo === 'Quartel GNR' || contact.tipo === 'Esquadra de Polícia') {
              for (const address of addresses) {
                if (contact.localidadepostal && address.formatted_address.toLowerCase().includes(contact.localidadepostal.toLowerCase())) {
                  selectedAuthorities.push(contact)
                  selectedAuthoritiesCoords.push(`${contact.latitude},${contact.longitude}`)
                  break // breaks the inner for loop
                }
              }
            }
          }

          if (selectedAuthorities.length === 0) {
            showNoResults('Sem resultados relevantes, considerando a sua localização')
            return
          }

          console.log(selectedAuthorities)
          const googleMapsApiDistancesUrl = 'https://maps.googleapis.com/maps/api/distancematrix/json'
          $.get(`${googleMapsApiDistancesUrl}?key=${googleMapsKey}&language=pt-PT&origins=${latitude},${longitude}&destinations=${selectedAuthoritiesCoords.join('|')}`,
            function (result) {
              console.log('Distances:', result)
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
              listAuthoritiesByDistance(selectedAuthorities)
            })
        } else {
          console.error('error on reverseGeocoder')
          showNoResults('Erro no serviço de geolocalização')
        }
      })
    })
  }

  function listAuthoritiesByDistance (authorities) {
    // sort array of authorities by distance to destination
    var authoritiesSortedByDistance = authorities.sort((a, b) => {
      if (a.distance.value < b.distance.value) {
        return -1
      }
      if (a.distance.value > b.distance.value) {
        return 1
      }
      return 0
    })
    console.log(authoritiesSortedByDistance)

    $('#authorities_list').find('*').off() // removes all event handlers
    $('#authorities_list').empty()

    for (let i = 0; i < authoritiesSortedByDistance.length && i < 5; i++) {
      const authority = authoritiesSortedByDistance[i]
      $('#authorities_list').append(`
        <div class="p-3 border-element authorities_list_element" data-index="${i}">
          <b>${authority.designacao}</b><br>
          <b>Tipo</b>: ${authority.tipo}<br>
          <b>Distância</b>: ${authority.distance.text}<br>
          ${authority.horario ? '<b>Horário</b>: ' + authority.horario + '<br>' : ''}
          <b>Morada</b>: ${authority.morada}, <span style="white-space: nowrap;">${authority.codigopostal} ${authority.localidadepostal}</span><br>
          <b>Telefone</b>: ${authority.telefone}<br>
          <b>E-mail</b>: ${authority.email}
          <div class="d-flex justify-content-around">
            <button type="button" class="mt-2 btn-authorities-list fa fa-phone btn btn-success" id="phone_authority"></button>
            <button type="button" class="mt-2 btn-authorities-list fa fa-envelope btn btn-success" id="send_email_to_authority"></button>
          </div>
        </div>`
      )
    }
  }

  function showNoResults (message) {
    $('#authorities_list').find('*').off() // removes all event handlers
    $('#authorities_list').empty()
    $('#authorities_list').append(`<center>${message}</center>`)
  }

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
