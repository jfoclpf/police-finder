/* global app, $ */

app.contactsFunctions = (function (thisModule) {
  var contactsGNR
  var contactsPSP

  function init () {
    loadPoliceContacts()
  }

  function loadPoliceContacts (callback) {
    var d1 = $.Deferred()
    var d2 = $.Deferred()

    $.getJSON('/json/gnr.json', function (data) {
      contactsGNR = data
      d1.resolve()
    })
    $.getJSON('/json/psp.json', function (data) {
      contactsPSP = data
      d2.resolve()
    })

    $.when(d1, d2).then(function () {
      if (typeof callback === 'function') {
        callback(null, { contactsGNR, contactsPSP })
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
