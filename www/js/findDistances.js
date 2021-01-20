/* global app, $, google */

app.findDistances = (function (thisModule) {
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

          console.log(selectedAuthorities)
          const googleMapsApiDistancesUrl = 'https://maps.googleapis.com/maps/api/distancematrix/json'
          $.get(`${googleMapsApiDistancesUrl}?key=${googleMapsKey}&language=pt-PT&origins=${latitude},${longitude}&destinations=${selectedAuthoritiesCoords.join('|')}`,
            function (result) {
              console.log('Distances:', result)
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
    for (let i = 0; i < authoritiesSortedByDistance.length && i < 5; i++) {
      const authority = authoritiesSortedByDistance[i]
      $('#authorities_list').append(`
        <div class="p-3 border-element authorities_list_element" data-index="${i}">
          <b>${authority.designacao}</b><br>
          <b>Tipo</b>: ${authority.tipo}<br>
          <b>Distância</b>: ${authority.distance.text}<br>
          ${authority.horario ? '<b>Horário</b>: ' + authority.horario + '<br>' : ''}
          <b>Morada</b>: ${authority.morada}, <span style="white-space: nowrap;">${authority.codigopostal} ${authority.localidadepostal}</span><br>
          <b>Telefone</b>: ${authority.telefone}&nbsp;&nbsp;&nbsp;<button type="button" class="fa fa-phone btn btn-success btn-lg" id="phone_authority"></button><br>
          <b>E-mail</b>: ${authority.email}&nbsp;&nbsp;&nbsp;<button type="button" class="fa fa-envelope btn btn-success btn-lg" id="send_email_to_authority"></button><br>
        </div>`
      )
    }
  }

  thisModule.calculateDistancesToAuthorities = calculateDistancesToAuthorities

  return thisModule
})(app.findDistances || {})
