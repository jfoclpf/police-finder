/***********************************************************************/
/* When the user clicks on the Map section on the left panel, the user
   should see a map of all complaints previously submitted by all users
   These complaints are anonymously stored in the database             */

/* eslint camelcase: off */
/* eslint no-prototype-builtins: off */
/* global app, cordova, $, performance, L, DEBUG */

app.map = (function (thisModule) {
  var map
  var markersGroups // groups of markers, by type of occurence
  var isMapInitiated = false

  var allAuthorities // fetched from JSON files

  function init () {
    // to get all entries to show on the map, it does it in the init in the background
    // after opening the app for faster processing when user clicks on map section
    var tLoadMapInit = performance.now() // to measure performance
    getAllEntries((err, contacts) => {
      if (err) {
        console.error(err)
      } else {
        allAuthorities = contacts
        processMapMarkers()
        initializeMap(() => {
          isMapInitiated = true
          console.log('Processing map took ' + Math.round(performance.now() - tLoadMapInit) + ' milliseconds')
        })
      }
    })

    // populate select box to select map view, i.e, filter ocurrences/drops in the map
    markersGroups = {
      all: { select: 'Todas as autoridades' },
      'Quartel GNR': { select: 'Quartéis da GNR' },
      'Esquadra de Polícia': { select: 'Esquadras de Polícia' }
    }

    // populates select box
    for (const key in markersGroups) {
      if (markersGroups.hasOwnProperty(key)) {
        $('#map_view_select').append(`<option value="${key}">${markersGroups[key].select}</option>`)
      }
    }

    $('#map_view_select').on('change', function () {
      tryToShowMap(this.value)
    })
  }

  // does not show map until the DB entries are loaded
  function tryToShowMap (selectOption) {
    if (!isMapInitiated) {
      setTimeout(() => {
        if (isMapInitiated) {
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
    // clears all layers from previous selections
    for (const key in markersGroups) {
      if (
        markersGroups.hasOwnProperty(key) &&
        markersGroups[key].markerClusterGroup &&
        markersGroups[key].markerClusterGroup.getLayers().length
      ) {
        map.removeLayer(markersGroups[key].markerClusterGroup)
      }
    }

    if (
      markersGroups[selectOption] &&
      markersGroups[selectOption].markerClusterGroup.getLayers().length
    ) {
      map.addLayer(markersGroups[selectOption].markerClusterGroup)
    }
  }

  function initializeMap (callback) {
    // get coordinates for the map center
    var currentLocation = app.localization.getCoordinates() // current position of user
    var latitude, longitude
    if (currentLocation.latitude && currentLocation.longitude && !DEBUG) {
      latitude = currentLocation.latitude
      longitude = currentLocation.longitude
    } else {
      // coordinates of Lisbon
      latitude = 38.736946
      longitude = -9.142685
    }

    const mapOptions = {
      center: [latitude, longitude],
      zoom: 8,
      maxBounds: L.latLngBounds(L.latLng(43.882057, -11.030141), L.latLng(35.942436, -4.104133)),
      zoomControl: false,
      attributionControl: false,
      closePopupOnClick: false
    }

    map = L.map('map', mapOptions)

    // add the OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      minZoom: 6,
      subdomains: ['a', 'b', 'c']
    }).addTo(map)

    setInterval(function () {
      map.invalidateSize()
    }, 500)

    map.on('popupopen', function (e) {
      $('img.photo-in-popup').on('load', function () {
        e.popup.update()
      })
    })

    // when map is loaded
    map.whenReady(function () {
      // adjust height of map_section div, the heigh of map should be the height of content
      // minus the height of header and minus height of a spacer (<hr>)
      var height = window.innerHeight - // screen useful height
        $('#content hr').outerHeight(true) - // spacer between header and lower section
        $('#content .container-fluid.section-head.d-flex.flex-row').outerHeight(true) - // header
        ($('#content').innerWidth() - $('#content').width()) // pading of #content

      $('#map_section').css('height', height + 'px')
      map.invalidateSize()
      callback()
    })
  }

  function processMapMarkers () {
    // create an array for each type of occurence
    for (const key in markersGroups) {
      if (markersGroups.hasOwnProperty(key)) {
        markersGroups[key].markerClusterGroup = L.markerClusterGroup(
          { disableClusteringAtZoom: 12, spiderfyOnMaxZoom: false }
        )
      }
    }

    // Sort markers and infowindows to the map
    const allAuthoritiesLength = allAuthorities.length
    const gnrMapIcon = L.icon({
      iconUrl: cordova.file.applicationDirectory + 'www/img/gnr-icon-map.png',
      iconSize: [42, 60],
      iconAnchor: [21, 60]
    })
    const pspMapIcon = L.icon({
      iconUrl: cordova.file.applicationDirectory + 'www/img/psp-icon-map.png',
      iconSize: [42, 60],
      iconAnchor: [21, 60]
    })

    for (let i = 0; i < allAuthoritiesLength; i++) {
      const authority = allAuthorities[i]

      let mapIcon
      if (authority.autoridade === 'GNR') {
        mapIcon = gnrMapIcon
      } else if (authority.autoridade === 'PSP') {
        mapIcon = pspMapIcon
      }

      const marker = L.marker(
        [parseFloat(authority.latitude), parseFloat(authority.longitude)],
        { icon: mapIcon }
      )

      const htmlInfoContent =
        `<div style="width:200px">
          <b>${authority.designacao}</b><br>
          <b>Tipo</b>: ${authority.tipo}<br>
          ${authority.horario ? '<b>Horário</b>: ' + authority.horario + '<br>' : ''}
          <b>Morada</b>: ${authority.morada}, <span style="white-space: nowrap;">${authority.codigopostal} ${authority.localidadepostal}</span><br>
          <b>Telefone</b>: ${authority.telefone}<br>
          ${authority.email.includes('@') ? `<b>E-mail</b>: ${authority.email}<br>` : ''}
          <div class="d-flex justify-content-around">
            <button type="button" class="mt-2 fa fa-phone btn btn-success" onclick="app.map.phoneAuthority('${authority.telefone}')"></button>
            ${authority.email.includes('@') ? `<button type="button" class="mt-2 fa fa-envelope btn btn-success" onclick="app.map.sendEmailToAuthority('${authority.email}')"></button>` : ''}
          </div>
        </div>`

      const popup = L.popup({ closeOnClick: false, autoClose: false, autoPan: false, maxHeight: 400 })
        .setContent(htmlInfoContent)

      marker.bindPopup(popup)

      if (markersGroups[authority.tipo]) {
        markersGroups[authority.tipo].markerClusterGroup.addLayer(marker)
      }
      markersGroups.all.markerClusterGroup.addLayer(marker)
    }
  }

  function phoneAuthority (telefone) {
    cordova.InAppBrowser.open(`tel:${parseInt(telefone)}`, '_system')
  }

  function sendEmailToAuthority (email) {
    cordova.InAppBrowser.open(`mailto:${email}`, '_system')
  }

  function getAllEntries (callback) {
    app.contactsFunctions.loadPoliceContacts(function (err, contacts) {
      if (err) {
        console.error('error on loadPoliceContacts')
        callback(err)
      } else {
        callback(null, contacts)
      }
    })
  }

  thisModule.init = init
  thisModule.tryToShowMap = tryToShowMap
  thisModule.phoneAuthority = phoneAuthority
  thisModule.sendEmailToAuthority = sendEmailToAuthority

  return thisModule
})(app.map || {})
