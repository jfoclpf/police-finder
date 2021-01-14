/* eslint camelcase: off */

/* global app, $, DEBUG */

app.show = (function (thisModule) {
  /* ********************************************************************** */
  /* ******************* FIELDS FETCHING FUNCTIONS ******************* */

  function getFullAddress () {
    const streetNumber = getStreetNumber()
    if (streetNumber) {
      return `${getStreetName()} n. ${streetNumber}, ${getLocality()}`
    } else {
      return `${getStreetName()}, ${getLocality()}`
    }
  }

  function getLocality () {
    return $('#locality').val()
  }

  function getStreetName () {
    return $('#street').val()
  }

  function getStreetNumber () {
    return $('#street_number').val() ? $('#street_number').val() : ''
  }

  function getAuthority () {
    return $('#authority option:selected').text()
  }

  /* ********************************************************************** */
  /* ******************* IS FORM CORRECTLY FILLED  ************************ */
  // returns true if all the fields and inputs in the form are filled in and ready to write the message
  function isMessageReady () {
    if (DEBUG) {
      return true
    }

    var to_break = false
    var error_string = ''
    var count = 0

    // loops through mandatory fields
    $('.mandatory').each(function () {
      var val = $(this).val()
      if (val == null || val === undefined || val === '' || (val).length === 0 || (val).replace(/^\s+|\s+$/g, '').length === 0) {
        console.log('Error on #' + $(this).attr('id'))
        error_string += '- ' + $(this).attr('name') + '<br>'
        count++
        to_break = true
      }
    })

    console.log('#generate_message goes', to_break)
    if (to_break) {
      if (count === 1) {
        $.jAlert({
          title: 'Erro!',
          theme: 'red',
          content: 'Preencha o seguinte campo obrigatório:<br>' + error_string
        })
      } else {
        $.jAlert({
          title: 'Erro!',
          theme: 'red',
          content: 'Preencha os seguintes campos obrigatórios:<br>' + error_string
        })
      }
      return false
    }

    // detects if the name is correctly filled in
    var Name = $('#name').val()
    if (!app.personalInfo.isFullNameOK(Name) && !DEBUG) {
      $.jAlert({
        title: 'Erro no nome!',
        theme: 'red',
        content: 'Insira o nome completo.'
      })
      return false
    }

    if (!app.personalInfo.isPostalCodeOK() && !DEBUG) {
      $.jAlert({
        title: 'Erro no Código Postal!',
        theme: 'red',
        content: 'Insira o Código Postal no formato XXXX-XXX'
      })
      return false
    }

    // from here the inputs are correctly written
    return true
  }

  /* ************** GENERAL FORM HANDLERS ******************* */
  // removes leading and trailing spaces on every text field "on focus out"
  $(':text').each(function (index) {
    $(this).focusout(function () {
      var text = $(this).val()
      text = $.trim(text)
      text = text.replace(/\s\s+/g, ' ') // removes consecutive spaces in-between
      $(this).val(text)
    })
  })

  /* ********************************************************************** */
  /* ********************* LOCAL OF OCCURRENCE **************************** */
  $('#locality').on('input', function () {
    if ($(this).val() === '' && !DEBUG) {
      $(this).css('border-color', 'red')
    } else {
      $(this).css('border-color', '')
    }
  })

  $('#locality').focusout(function () {
    app.localization.getAuthoritiesFromAddress()
  })

  $('#street').on('input', function () {
    if ($(this).val() === '' && !DEBUG) {
      $(this).css('border-color', 'red')
    } else {
      $(this).css('border-color', '')
    }
  })

  $('#street_number').on('input', function () {
    if ($(this).val() === '' && !DEBUG) {
      $(this).css('border-color', 'red')
    } else {
      $(this).css('border-color', '')
    }
  })

  /* === Public methods to be returned === */
  /* === Form field fetching functions === */
  thisModule.getFullAddress = getFullAddress
  thisModule.getLocality = getLocality
  thisModule.getStreetName = getStreetName
  thisModule.getStreetNumber = getStreetNumber
  thisModule.getAuthority = getAuthority
  /* ======================================== */
  thisModule.isMessageReady = isMessageReady

  return thisModule
})(app.show || {})
