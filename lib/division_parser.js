var fs = require('fs')
var cheerio = require('cheerio')
var request = require('request')
var _ = require('lodash')

request('http://www.police.gov.hk/ppp_en/contact_us.html', (req, res) => {
  var $ = cheerio.load(res.body)
  var tables = $('#main_content_area table.table_01')

  var districts = tables
    .filter((t) => $('.sub_header', t).length > 0)
    .map((e) => {
      var region = $('.sub_header', e).text()
      var divisions = $('tr', e)
        .filter((tr) => { $('td', tr).length == 3 })
        .map((tr) => { $('td:nth-child(1)', tr).children[0].text() })
      return {
        region: region,
        divisions: divisions
      }
    })

  console.log("districts ", districts)
})
