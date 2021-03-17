//  LOCALIZATION/GPS/Contacts

/* global app, $ */

app.localization = (function (thisModule) {
  var Latitude, Longitude

  function loadMapsApi () {
    if (!navigator.onLine) {
      console.log('Device Navigator not online')
    } else {
      console.log('Device Navigator is online')
      getGeolocation()
    }
  }

  // botão get address by GPS (Atualizar)
  $('#getCurrentAddresBtn').click(function () {
    getGeolocation()
    app.functions.updateDateAndTime()
  })

  /* Geo location functions */
  function getGeolocation () {
    // detect if has Internet AND if the GoogleMaps API is loaded
    if (navigator.onLine) {
      GPSLoadingOnFields(true) // truns on loading icon on the fields
      var options = { timeout: 30000, enableHighAccuracy: true }
      navigator.geolocation.getCurrentPosition(getPosition, PositionError, options)
    } else {
      PositionError()
    }
  }

  function getPosition (position) {
    var latitude = position.coords.latitude
    Latitude = latitude
    var longitude = position.coords.longitude
    Longitude = longitude
    console.log('latitude, longitude: ', latitude, longitude)
    app.findDistances.calculateDistancesToAuthorities(latitude, longitude)
    getCurrentAddress(latitude, longitude) // Pass the latitude and longitude to get address.
  }

  // to be used from outside of this module
  function getCoordinates () {
    var coordinates = {
      latitude: Latitude,
      longitude: Longitude
    }
    return coordinates
  }

  function PositionError () {
    $.jAlert({
      title: 'Erro na obtenção do local da ocorrência!',
      theme: 'red',
      content: 'Confirme se tem o GPS ligado e autorizado, e se tem acesso à Internet. Caso contrário pode introduzir manualmente o Concelho, Local (rua, travessa, etc.) e número de porta da ocorrência.'
    })
    GPSLoadingOnFields(false)
  }

  function getCurrentAddress (latitude, longitude) {
    $.ajax({
      url: app.main.urls.openStreetMaps.nominatimReverse,
      data: {
        lat: latitude,
        lon: longitude,
        format: 'json',
        namedetails: 1,
        'accept-language': 'pt'
      },
      dataType: 'json',
      type: 'GET',
      async: true,
      crossDomain: true
    }).done(function (res) {
      const address = res.address
      console.log(address)
      getCurrentAddressDetails(address)
    }).fail(function (err) {
      console.error(err)
      PositionError()
    })
  }

  function getCurrentAddressDetails (address) {
    if (address) {
      // clear inputs
      $('#locality').val('')
      $('#street').val('')
      $('#street_number').val('')

      if (address.road) {
        $('#street').val(address.road) // nome da rua/avenida/etc.
      }

      if (address.house_number) {
        $('#street_number').val(address.house_number)
      }

      // from the Postal Code got from OMS
      // tries to get locality using the offline Data Base (see file contacts.js)
      var localityFromDB, municipalityFromDB
      if (address.postcode) {
        const dataFromDB = getDataFromPostalCode(address.postcode)
        localityFromDB = dataFromDB.locality
        municipalityFromDB = dataFromDB.municipality
      }

      if (address.municipality) {
        $('#locality').val(address.municipality)
      } else if (address.city) {
        $('#locality').val(address.city)
      } else if (address.town) {
        $('#locality').val(address.town)
      } else if (address.village) {
        $('#locality').val(address.village)
      } else if (address.suburb) {
        $('#locality').val(address.suburb)
      } else if (municipalityFromDB) {
        $('#locality').val(municipalityFromDB)
      } else if (localityFromDB) {
        $('#locality').val(localityFromDB)
      }
    }
    GPSLoadingOnFields(false)
  }

  // GPS/Google Postal Code -> Localities.postalCode -> Localities.municipality ->  Municipalities.code -> Municipalities.name -> PM_Contacts.nome
  function getDataFromPostalCode (postalCode) {
    var toReturn

    postalCode = postalCode.substring(0, 4) // gets first 4 characters
    if (postalCode.length !== 4) {
      toReturn = {
        locality: '',
        municipality: ''
      }
      return toReturn
    }

    console.log('getDataFromPostalCode: ' + postalCode, typeof postalCode)

    var key, locality, municipality, municipalityCode

    for (key in app.contacts.Localities) {
      if (app.contacts.Localities[key].postalCode === postalCode) {
        locality = app.contacts.Localities[key].locality
        municipalityCode = app.contacts.Localities[key].municipality
        break
      }
    }

    for (key in app.contacts.Municipalities) {
      if (app.contacts.Municipalities[key].code === municipalityCode) {
        municipality = app.contacts.Municipalities[key].name
        break
      }
    }

    toReturn = {
      locality: $.trim(locality),
      municipality: $.trim(municipality)
    }
    return toReturn
  }

  // removes the loading gif from input fields
  function GPSLoadingOnFields (bool) {
    if (bool) {
      $('#locality').addClass('loading')
      $('#street').addClass('loading')
      $('#street_number').addClass('loading')
    } else {
      $('#street').removeClass('loading')
      $('#street').trigger('input')
      $('#street_number').removeClass('loading')
      $('#street_number').trigger('input')
      $('#locality').removeClass('loading')
      $('#locality').trigger('input')
    }
  }

  /* === Public methods to be returned === */
  thisModule.loadMapsApi = loadMapsApi
  thisModule.getGeolocation = getGeolocation
  thisModule.getPosition = getPosition
  thisModule.getCoordinates = getCoordinates

  return thisModule
})(app.localization || {})
