var FeedParser = require('feedparser')
var fs = require('fs')
var _ = require('lodash')
var regions = require('./region')
var regionNames = regions.map((r) => r.region)

function isRegion(name) {
  var upperName = name.replace("TRAFFIC ", "").replace(" REGION", "").toUpperCase()
  return regionNames.indexOf(upperName) > -1
}

function getRegionName(name) {
  name = name.toUpperCase()
  if (isRegion(name)) {
    return name.replace("TRAFFIC ", "").replace(" REGION", "")

  } else {
    var region = _.find(regions, (r) => {
      return _.find(r.divisions, (d) => {
        return d.toUpperCase().indexOf(name.replace("DISTRICT", "").trim()) > -1
      })
    })
    if (region) {
      return region.region
    } else {
      return "OTHERS"
    }
  }
}

var policeRegexp = /praised in this letter (is|are)(.+?)of(.+)/
function parseItem(item) {
  var title = item.title
  var text = item.description
  var date = null
  var officers = null
  var unit = null
  var division = null
  var region = null

  var dateMatch = title.match(/^([0-9]{4}\-[0-9]{2}\-[0-9]{2})/)
  if (dateMatch) {
    date = dateMatch[1]
  }

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

    if (division == "Territories South Region") {
      division = "New Territories South Region"
    }
    if (division == "Wanchai Division") {
      division = "Wan Chai Division"
    }
    if (division == "Shatin District") {
      division = "Sha Tin Division"
    }
    if (division == "Lantau South Division") {
      division = "Lantau South (Mui Wo) Division"
    }
    if (division == "Yaumatei Division") {
      division = "Yau Ma Tei Division"
    }

    if (division == "Patrol Sub-unit 4 Western Division") {
      unit = "Patrol Sub-unit 4"
      division = "Western Division"
    } else if (division == "Emergency Unit Hong Kong Island") {
      unit = unit + ", Emergency Unit"
      division = "Hong Kong Island"
    } else if (division == "Patrol Sub-unit 2 Castle Peak Division") {
      unit = "Patrol Sub-unit 2"
      division = "Castle Peak Division"
    } else if (division == "District Investigation Team 3 of Yau Tsim District") {
      unit = "District Investigation Team 3"
      division = "Yau Tsim District"
      region = "KOWLOON EAST"

    } else if (division == "Enforcement and Control Division") {
      unit = division
      division = "Enforcement and Control Division"
    } else if (unit == "ficers working at Police Service Centre") {
      if (officers.length == 2 && officers[1] == "two") {
        officers.pop()
      }
      unit = "Police Service Centre"
    } else if (division == "DO Team 2 Cheung Sha Wan Division") {
      unit = "DO Team 2"
      division = "Cheung Sha Wan Division"
    } else if (division == "Platoon 2 of Emergency Unit of Hong Kong Island") {
      unit = "Platoon 2 of Emergency Unit"
      division = "Hong Kong Island"
    } else if (division == "District Investigation Team 5 Shatin District") {
      unit = "District Investigation Team 5"
      division = "Shatin District"
      region = "NEW TERRITORIES SOUTH"

    } else if (division == 'New Territories North Traffic Patrol Sub-unit 1') {
      division = 'New Territories North Region'
      unit = 'Traffic Patrol Sub-unit 1'
    }

    if (!region) {
      region = getRegionName(division)
    }
    division = division.toUpperCase().replace(" REGION", "")
  }

  return {
    date: date,
    title: title,
    text: text,
    officers: officers,
    unit: unit,
    division: division,
    region: region
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
