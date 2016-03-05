var FeedParser = require('feedparser')
var fs = require('fs')
var _ = require('lodash')

var file = "./data/appreciation_en.xml"
var parser = new FeedParser([])
var readStream = fs.createReadStream(file)

readStream.on('open', () => {
  readStream.pipe(parser)
})

parser.on('error', (error) => {
  console.log(`${error}`)
})

parser.on('readable', function(error) {
  var stream = this
  var item
  while(item = stream.read()) {
    var output = parseItem(item)
    if (output.officers) {
      console.log(JSON.stringify(output, null, 2))
    }
  }
})

var policeRegexp = /praised in this letter (is|are)(.+)of(.+)/

function parseItem(item) {
  var title = item.title
  var text = item.description
  var officers = null
  var unit = null
  var division = null

  var matches = text.match(policeRegexp)
  if (matches) {
    officers = _.trim(matches[2])
    var unitAndDivision = matches[3].split(",")
    if (unitAndDivision.length == 2) {
      unit = _.trim(unitAndDivision[0])
      division = _.trim(unitAndDivision[1])
    } else {
      unit = _.trim(unitAndDivision[0])
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
