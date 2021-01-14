/* eslint camelcase: off */

/* global app, $ */

app.text = (function (thisModule) {
  // main message
  function getMainMessage (option) {
    if (option === 'body') {
      // Penalties
      var penaltyDescription
      var penaltyLawArticle
      var penalties = app.penalties.getPenalties()

      for (const key in penalties) {
        if (!Object.prototype.hasOwnProperty.call(penalties, key)) continue

        var obj = penalties[key]
        if ($('#penalties').val() === key) {
          penaltyDescription = obj.description
          penaltyLawArticle = obj.law_article
        }
      }

      var carPlateStr = app.show.getCarPlate()

      // texto para marca e modelo
      var is_carmake = ($('#carmake').val().replace(/^\s+|\s+$/g, '').length !== 0)
      var is_model = ($('#carmodel').val().replace(/^\s+|\s+$/g, '').length !== 0)
      var carmake_model_txt
      if (is_carmake && is_model) {
        carmake_model_txt = 'de marca e modelo <b>' + $('#carmake').val() +
          ' ' + $('#carmodel').val() + '</b>, '
      } else if (is_carmake) {
        carmake_model_txt = 'de marca <b>' + $('#carmake').val() + '</b>, '
      } else if (is_model) {
        carmake_model_txt = 'de modelo <b>' + $('#carmodel').val() + '</b>, '
      } else {
        carmake_model_txt = ''
      }

      var msg = getRandomGreetings() + ' da ' + getNameOfCurrentSelectedAuthority() + ';'

      var msg1 = 'Eu, <b>' + $('#name').val() + '</b>,' +
        ' com o <b>' + $('#id_type').val() + '</b> com o número <b>' + $('#id_number').val() + '</b> ' +
        'e com residência em <b>' + $('#address').val() +
        ', ' + $('#postal_code').val() + ', ' + $('#address_city').val() +
        '</b>, venho por este meio,' + ' ' +
        'ao abrigo do n.º 5 do artigo 170.º do Código da Estrada, ' +
        'fazer a seguinte denúncia de contra-ordenação para que V. Exas. ' +
        'levantem o auto respetivo e multem o infra-mencionado responsável.'

      var msg2 = 'No passado dia <b>' +
        $.datepicker.formatDate("dd' de 'MM' de 'yy", $('#date').datepicker('getDate')) + '</b>' +
        ($('#time').val() ? ' pelas <b>' + $('#time').val() + '</b>' : '') + // optional
        ', ' + 'na <b>' + $('#street').val() + ', ' + $('#locality').val() + '</b>, ' +
        ($('#street_number').val() ? 'aproximadamente junto à porta com o <b>número ' +
        $('#street_number').val() + '</b>, ' : '') + // optional
        'a viatura com matrícula <b>' + carPlateStr + '</b> ' + carmake_model_txt +
        'encontrava-se estacionada' + ' ' + penaltyDescription +
        ', em violação ' + penaltyLawArticle + '.'

      var msg3 = 'Pode-se comprovar esta situação através' +
        ' ' + ((app.photos.getImagesArray().length === 1) ? 'da fotografia anexa' : 'das fotografias anexas') +
        ' ' + 'à presente mensagem eletrónica. ' +
        'Juro pela minha honra que a informação supra citada é verídica.' +
        ' ' + 'Recordo ainda, que ao abrigo do referido n.º 5 do artigo 170.º do Código da Estrada,' +
        ' ' + 'a autoridade que tiver notícia por denúncia de contraordenação, levanta auto,' +
        ' ' + 'não carecendo de presenciar tal contraordenação rodoviária, ' +
        'situação a que se aplica o n.º 1 do mesmo artigo.' + '</b></b>' +
        ' ' + 'Refiro ainda que me encontro plenamente disponível para participar na qualidade de testemunha' +
        ' ' + 'no processo que vier a ser instaurado com referência à presente missiva.'

      var message = msg + '<br><br>' + msg1 + '<br><br>' + msg2 + '<br><br>' + msg3 + '<br><br>' + getRegards() + '<br>'

      return message
    } else if (option === 'subject') {
      const carPlateStr = app.show.getCarPlate()
      const address = app.show.getFullAddress()

      return `[${carPlateStr}] na ${address} - Denúncia de estacionamento ao abrigo do n.º 5 do art. 170.º do Código da Estrada`
    } else {
      console.error('Error in getMainMessage(option) wth option=' + option)
    }
  }

  function getNameOfCurrentSelectedAuthority () {
    // Authority
    var authority, authorityName
    var index = $('#authority').val()

    authority = app.localization.AUTHORITIES[index].authority
    authorityName = app.localization.AUTHORITIES[index].nome

    return authority + ', ' + authorityName
  }

  function getRandomGreetings () {
    var greetingsInitial = [
      'Excelentíssimos senhores',
      'Excelentíssimos agentes',
      'Prezados senhores',
      'Prezados agentes',
      'Caros senhores',
      'Ex.mos Senhores',
      'Ex.mos Senhores Agentes'
    ]

    return greetingsInitial[Math.floor(Math.random() * greetingsInitial.length)]
  }

  // best regards
  // Andrey
  function getRegards () {
    // gets a random regard
    var regards = [
      'Agradecendo antecipadamente a atenção de V. Ex.as, apresento os meus melhores cumprimentos',
      'Com os melhores cumprimentos',
      'Com os meus melhores cumprimentos',
      'Melhores cumprimentos',
      'Apresentando os meus melhores cumprimentos',
      'Atenciosamente',
      'Atentamente',
      'Respeitosamente'
    ]

    var regard = regards[Math.floor(Math.random() * regards.length)]

    // full name
    var Name = $('#name').val()
    // gets first and last name
    var ShortName = Name.split(' ')[0] + ' ' + Name.split(' ')[(Name.split(' ')).length - 1]

    var msgEnd = regard + ',<br>' + ShortName

    return msgEnd
  }

  /* === Public methods to be returned === */
  thisModule.getMainMessage = getMainMessage
  thisModule.getRegards = getRegards

  return thisModule
})(app.text || {})
