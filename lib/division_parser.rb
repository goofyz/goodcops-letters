require 'nokogiri'
require 'open-uri'
require 'pry'
require 'json'

html = open('http://www.police.gov.hk/ppp_en/contact_us.html').read
doc = Nokogiri::HTML(html)

output = doc
  .search('#main_content_area > table.table_01')
  .select { |e| # only section with header
    e.search('.sub_header').count > 0
  }
  .select { |e| # only supported sections
    title = e.search('.sub_header').text.strip
    [
      "HONG KONG ISLAND",
      "KOWLOON EAST",
      "KOWLOON WEST",
      "NEW TERRITORIES SOUTH",
      "NEW TERRITORIES NORTH",
      "MARINE"
    ].include?(title)
  }
  .map { |e|
    region = e.search('.sub_header').text.strip
    tr = e.search('./tr')
    divisions = tr
      .select { |tr| tr.search('./td').count == 3 }
      .map{|tr| tr.search('td:nth-child(1)').children[0].text.strip }
    { region: region, divisions: divisions }
  }

puts JSON.pretty_generate(output)
