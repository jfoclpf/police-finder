/* global app, cordova, $ */

app.contactsFunctions = (function (thisModule) {
  var contactsGNR
  var contactsPSP

  function init () {
    loadPoliceContacts()
  }

  function loadPoliceContacts (callback) {
    var d1 = $.Deferred()
    var d2 = $.Deferred()

    $.getJSON(cordova.file.applicationDirectory + 'www/json/gnr.json', function (data) {
      contactsGNR = data
      const length = contactsGNR.length
      for (let i = 0; i < length; i++) {
        contactsGNR[i].autoridade = 'GNR'
      }
      d1.resolve()
    })
    $.getJSON(cordova.file.applicationDirectory + 'www/json/psp.json', function (data) {
      contactsPSP = data
      const length = contactsPSP.length
      for (let i = 0; i < length; i++) {
        contactsPSP[i].autoridade = 'PSP'
      }
      d2.resolve()
    })

    $.when(d1, d2).then(function () {
      if (typeof callback === 'function') {
        const allAuthorities = contactsGNR.concat(contactsPSP) // concatenates arrays
        callback(null, allAuthorities)
      }
    }, function () {
      if (typeof callback === 'function') {
        callback(new Error('Get of files gnr.json or psp.json failed'))
      }
    })
  }

  function getContactsGNR () {
    return contactsGNR
  }

  function getContactsPSP () {
    return contactsPSP
  }

  thisModule.init = init
  thisModule.loadPoliceContacts = loadPoliceContacts
  thisModule.getContactsGNR = getContactsGNR
  thisModule.getContactsPSP = getContactsPSP

  return thisModule
})(app.contactsFunctions || {})
