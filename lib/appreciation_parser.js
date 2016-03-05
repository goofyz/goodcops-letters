var FeedParser = require('feedparser')
var fs = require('fs')
var _ = require('lodash')

var policeRegexp = /praised in this letter (is|are)(.+?)of(.+)/
function parseItem(item) {
  var title = item.title
  var text = item.description
  var officers = null
  var unit = null
  var division = null

  var matches = text.match(policeRegexp)
  if (matches) {
    officers = _.trim(matches[2])
    officers = officers.split(/(,|and)/)
      .filter((o) => o != "," && o != "and")
      .map((o) => _.trim(o))

    var unitAndDivision = matches[3].split(",")
    if (unitAndDivision.length >= 2) {
      division = unitAndDivision.pop()
      unit = unitAndDivision.join(",")
      unit = _.trim(unit)
      unit = _.replace(unit, '.', '')

      division = _.trim(division)
      division = _.replace(division, '.', '')
    } else {
      division = _.trim(unitAndDivision)
      division = _.replace(division, '.', '')
    }
  }

  return {
    title: title,
    text: text,
    officers: officers,
    unit: unit,
    division: division,
  }
}

function parseAppreciationLetter(file, callback) {
  var parser = new FeedParser([])
  var readStream = fs.createReadStream(file)
  var error = null
  var items = []

  readStream.on('open', () => {
    readStream.pipe(parser)
  })

  parser.on('error', (theError) => {
    error = theError
  })

  readStream.on('close', () => {
    if (error) {
      callback(error)
    } else {
      callback(null, items)
    }
  })

  parser.on('readable', function(error) {
    var stream = this
    var item
    while(item = stream.read()) {
      var output = parseItem(item)
      if (output.officers) {
        items.push(output)
      }
    }
  })
}

module.exports = parseAppreciationLetter
