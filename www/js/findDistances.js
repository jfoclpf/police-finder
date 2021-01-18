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
            function (data) {
              console.log('Distances:', data)
            })
        } else {
          console.error('error on reverseGeocoder')
        }
      })
    })
  }

  thisModule.calculateDistancesToAuthorities = calculateDistancesToAuthorities

  return thisModule
})(app.findDistances || {})
