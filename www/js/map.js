/***********************************************************************/
/* When the user clicks on the Map section on the left panel, the user
   should see a map of all complaints previously submitted by all users
   These complaints are anonymously stored in the database             */

/* eslint camelcase: off */
/* global app, cordova, $, google, performance, DEBUG */

app.map = (function (thisModule) {
  var isGoogleMapsApiLoaded = false

  var allAuthorities // fetched from JSON files
  var filteredAuthorities

  // to measure performance
  var tLoadMapInit
  var tLoadMapEnd

  function init () {
    // to get all entries to show on the map, it does it in the init in the background
    // after opening the app for faster processing when user clicks on map section
    getAllEntries()

    // populate select box to select map view, i.e, filter ocurrences/drops in the map
    var mapOptions = {
      all: 'Todas as autoridades',
      'Quartel GNR': 'Quartel GNR',
      'Esquadra de Polícia': 'Esquadra da PSP'
    }

    for (const key in mapOptions) {
      $('#map_view_select').append(`<option value="${key}">${mapOptions[key]}</option>`)
    }

    $('#map_view_select').on('change', function () {
      tryToShowMap(this.value)
    })
  }

  // this funcion is run when the API is loaded, see file js/localization.js
  function onGoogleMapsApiLoaded () {
    isGoogleMapsApiLoaded = true
  }

  // does not show map until the Google API script and the entries are loaded
  // this done on the beginning
  function tryToShowMap (selectOption) {
    if (!isGoogleMapsApiLoaded || !allAuthorities) {
      setTimeout(() => {
        if (isGoogleMapsApiLoaded && allAuthorities) {
          showMap(selectOption)
        } else {
          tryToShowMap(selectOption)
        }
      }, 500)
    } else {
      showMap(selectOption)
    }
  }

  // selectOption can be: 'all', 'mine' or the respective legal basis ('passeios', 'na_passadeira', etc.)
  function showMap (selectOption) {
    tLoadMapInit = performance.now()
    tLoadMapEnd = null

    // get coordinates for the map center
    var currentLocation = app.localization.getCoordinates() // current position of user
    var latitude, longitude
    if (currentLocation.latitude && currentLocation.longitude) {
      latitude = currentLocation.latitude
      longitude = currentLocation.longitude
    } else {
      // coordinates of Lisbon
      latitude = 38.736946
      longitude = -9.142685
    }

    const mapOptions = {
      center: { lat: latitude, lng: longitude },
      disableDefaultUI: true,
      streetViewControl: false,
      gestureHandling: 'greedy',
      zoom: 12,
      restriction: {
        latLngBounds: {
          east: -6,
          north: 44,
          south: 34,
          west: -10
        },
        strictBounds: true
      }
    }

    const map = new google.maps.Map(document.getElementById('map'), mapOptions)

    // get filtered array of authorities according to selected Option (filter)
    filteredAuthorities = []
    if (!selectOption || selectOption === 'all') {
      filteredAuthorities = allAuthorities
    } else {
      const allAuthoritiesLength = allAuthorities.length
      for (let i = 0; i < allAuthoritiesLength; i++) {
        if (selectOption === allAuthorities[i].tipo) {
          filteredAuthorities.push(allAuthorities[i])
        }
      }
    }

    // Add the markers and infowindows to the map
    const filteredAuthoritiesLength = filteredAuthorities.length
    const gnrMapIconUrl = cordova.file.applicationDirectory + 'www/img/gnr-icon-map.png'
    const pspMapIconUrl = cordova.file.applicationDirectory + 'www/img/psp-icon-map.png'
    for (let i = 0; i < filteredAuthoritiesLength; i++) {
      const authority = filteredAuthorities[i]

      let icon
      if (authority.tipo === 'Quartel GNR') {
        icon = gnrMapIconUrl
      } else if (authority.tipo === 'Esquadra de Polícia' || authority.tipo === 'Posto de Polícia') {
        icon = pspMapIconUrl
      }

      const marker = new google.maps.Marker({
        position: { lat: parseFloat(authority.latitude), lng: parseFloat(authority.longitude) },
        map: map,
        icon: icon
      })

      const htmlInfoContent =
        `<div style="width:200px">
          <b>${authority.designacao}</b><br>
          <b>Tipo</b>: ${authority.tipo}<br>
          ${authority.horario ? '<b>Horário</b>: ' + authority.horario + '<br>' : ''}
          <b>Morada</b>: ${authority.morada}, <span style="white-space: nowrap;">${authority.codigopostal} ${authority.localidadepostal}</span><br>
          <b>Telefone</b>: ${authority.telefone}<br>
          ${authority.email.includes('@') ? `<b>E-mail</b>: ${authority.email}<br>` : ''}
          <div class="d-flex justify-content-around">
            <button type="button" class="mt-2 fa fa-phone btn btn-success" onclick="app.map.phoneAuthority(${i})"></button>
            ${authority.email.includes('@') ? `<button type="button" class="mt-2 fa fa-envelope btn btn-success" onclick="app.map.sendEmailToAuthority(${i})"></button>` : ''}
          </div>
        </div>`

      google.maps.event.addListener(marker, 'click', (function (_marker, _htmlInfoContent) {
        return function () {
          const infowindow = new google.maps.InfoWindow()
          infowindow.setContent(_htmlInfoContent)
          infowindow.open(map, _marker)
        }
      })(marker, htmlInfoContent))
    }

    // current user location
    const userPosMarker = new google.maps.Marker({ // eslint-disable-line no-unused-vars
      position: { lat: currentLocation.latitude, lng: currentLocation.longitude },
      map: map,
      icon: cordova.file.applicationDirectory + 'www/img/map-location-user.png'
    })

    // when map is loaded
    map.addListener('tilesloaded', function () {
      if (!tLoadMapEnd) {
        tLoadMapEnd = performance.now()
        console.log('Loading map took ' + (tLoadMapEnd - tLoadMapInit) + ' milliseconds.')
      }
      // adjust height of map_section div, the heigh of map should be the height of content
      // minus the height of header and minus height of a spacer (<hr>)
      var height = window.innerHeight - // screen useful height
        $('#content hr').outerHeight(true) - // spacer between header and lower section
        $('#content .container-fluid.section-head.d-flex.flex-row').outerHeight(true) - // header
        ($('#content').innerWidth() - $('#content').width()) // pading of #content

      $('#map_section').css('height', height + 'px')
    })
  }

  function phoneAuthority (i) {
    cordova.InAppBrowser.open(`tel:${parseInt(filteredAuthorities[i].telefone)}`, '_system')
  }

  function sendEmailToAuthority (i) {
    cordova.InAppBrowser.open(`mailto:${filteredAuthorities[i].email}`, '_system')
  }

  function getAllEntries () {
    app.contactsFunctions.loadPoliceContacts(function (err, contacts) {
      if (err) {
        console.error('error on loadPoliceContacts')
        return
      }

      const contactsGNR = contacts.contactsGNR
      const contactsPSP = contacts.contactsPSP
      allAuthorities = contactsGNR.concat(contactsPSP) // concatenates arrays
    })
  }

  thisModule.init = init
  thisModule.tryToShowMap = tryToShowMap
  thisModule.onGoogleMapsApiLoaded = onGoogleMapsApiLoaded
  thisModule.phoneAuthority = phoneAuthority
  thisModule.sendEmailToAuthority = sendEmailToAuthority

  return thisModule
})(app.map || {})
