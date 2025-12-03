// Major US Cities Recruiting Stations (~200 stations)
// Format: Station Code = [Region][Metro][Station]
// Example: 1G2R = Region 1, Metro G (NYC), Station 2R (Ridgewood)

export const MAJOR_CITIES_STATIONS = [
  // NEW YORK - Northeast Region 1, Metro G
  { state: "New York", city: "Manhattan", code: "1G1A", name: "Manhattan Recruiting Station", zipCode: "10001" },
  { state: "New York", city: "Brooklyn", code: "1G2B", name: "Brooklyn Recruiting Station", zipCode: "11201" },
  { state: "New York", city: "Queens", code: "1G3Q", name: "Queens Recruiting Station", zipCode: "11354" },
  { state: "New York", city: "Bronx", code: "1G4X", name: "Bronx Recruiting Station", zipCode: "10451" },
  { state: "New York", city: "Staten Island", code: "1G5S", name: "Staten Island Recruiting Station", zipCode: "10301" },
  { state: "New York", city: "Buffalo", code: "1H1B", name: "Buffalo Recruiting Station", zipCode: "14202" },
  { state: "New York", city: "Rochester", code: "1H2R", name: "Rochester Recruiting Station", zipCode: "14604" },
  { state: "New York", city: "Syracuse", code: "1H3S", name: "Syracuse Recruiting Station", zipCode: "13202" },
  { state: "New York", city: "Albany", code: "1H4A", name: "Albany Recruiting Station", zipCode: "12207" },
  { state: "New York", city: "Yonkers", code: "1G6Y", name: "Yonkers Recruiting Station", zipCode: "10701" },

  // CALIFORNIA - West Region 6, Metro A-D
  { state: "California", city: "Los Angeles", code: "6A1L", name: "Los Angeles Downtown Recruiting Station", zipCode: "90012" },
  { state: "California", city: "Los Angeles", code: "6A2H", name: "Los Angeles Hollywood Recruiting Station", zipCode: "90028" },
  { state: "California", city: "San Diego", code: "6B1S", name: "San Diego Recruiting Station", zipCode: "92101" },
  { state: "California", city: "San Jose", code: "6C1J", name: "San Jose Recruiting Station", zipCode: "95110" },
  { state: "California", city: "San Francisco", code: "6C2F", name: "San Francisco Recruiting Station", zipCode: "94102" },
  { state: "California", city: "Fresno", code: "6D1F", name: "Fresno Recruiting Station", zipCode: "93721" },
  { state: "California", city: "Sacramento", code: "6D2S", name: "Sacramento Recruiting Station", zipCode: "95814" },
  { state: "California", city: "Long Beach", code: "6A3L", name: "Long Beach Recruiting Station", zipCode: "90802" },
  { state: "California", city: "Oakland", code: "6C3O", name: "Oakland Recruiting Station", zipCode: "94612" },
  { state: "California", city: "Bakersfield", code: "6D3B", name: "Bakersfield Recruiting Station", zipCode: "93301" },
  { state: "California", city: "Anaheim", code: "6A4A", name: "Anaheim Recruiting Station", zipCode: "92805" },
  { state: "California", city: "Riverside", code: "6E1R", name: "Riverside Recruiting Station", zipCode: "92501" },
  { state: "California", city: "Stockton", code: "6D4S", name: "Stockton Recruiting Station", zipCode: "95202" },

  // TEXAS - South Region 5, Metro A-D
  { state: "Texas", city: "Houston", code: "5A1H", name: "Houston Downtown Recruiting Station", zipCode: "77002" },
  { state: "Texas", city: "Houston", code: "5A2H", name: "Houston Galleria Recruiting Station", zipCode: "77056" },
  { state: "Texas", city: "San Antonio", code: "5B1S", name: "San Antonio Recruiting Station", zipCode: "78205" },
  { state: "Texas", city: "Dallas", code: "5C1D", name: "Dallas Downtown Recruiting Station", zipCode: "75201" },
  { state: "Texas", city: "Dallas", code: "5C2D", name: "Dallas North Recruiting Station", zipCode: "75248" },
  { state: "Texas", city: "Austin", code: "5D1A", name: "Austin Recruiting Station", zipCode: "78701" },
  { state: "Texas", city: "Fort Worth", code: "5C3F", name: "Fort Worth Recruiting Station", zipCode: "76102" },
  { state: "Texas", city: "El Paso", code: "5E1E", name: "El Paso Recruiting Station", zipCode: "79901" },
  { state: "Texas", city: "Arlington", code: "5C4A", name: "Arlington Recruiting Station", zipCode: "76010" },
  { state: "Texas", city: "Corpus Christi", code: "5B2C", name: "Corpus Christi Recruiting Station", zipCode: "78401" },
  { state: "Texas", city: "Plano", code: "5C5P", name: "Plano Recruiting Station", zipCode: "75074" },
  { state: "Texas", city: "Laredo", code: "5F1L", name: "Laredo Recruiting Station", zipCode: "78040" },

  // FLORIDA - Southeast Region 3, Metro A-C
  { state: "Florida", city: "Miami", code: "3A1M", name: "Miami Recruiting Station", zipCode: "33130" },
  { state: "Florida", city: "Miami", code: "3A2M", name: "Miami Beach Recruiting Station", zipCode: "33139" },
  { state: "Florida", city: "Tampa", code: "3B1T", name: "Tampa Recruiting Station", zipCode: "33602" },
  { state: "Florida", city: "Orlando", code: "3C1O", name: "Orlando Recruiting Station", zipCode: "32801" },
  { state: "Florida", city: "Jacksonville", code: "3D1J", name: "Jacksonville Recruiting Station", zipCode: "32202" },
  { state: "Florida", city: "Fort Lauderdale", code: "3A3F", name: "Fort Lauderdale Recruiting Station", zipCode: "33301" },
  { state: "Florida", city: "St. Petersburg", code: "3B2S", name: "St. Petersburg Recruiting Station", zipCode: "33701" },
  { state: "Florida", city: "Tallahassee", code: "3D2T", name: "Tallahassee Recruiting Station", zipCode: "32301" },
  { state: "Florida", city: "Cape Coral", code: "3E1C", name: "Cape Coral Recruiting Station", zipCode: "33990" },
  { state: "Florida", city: "Pembroke Pines", code: "3A4P", name: "Pembroke Pines Recruiting Station", zipCode: "33024" },

  // ILLINOIS - Midwest Region 4, Metro A
  { state: "Illinois", city: "Chicago", code: "4A1C", name: "Chicago Downtown Recruiting Station", zipCode: "60601" },
  { state: "Illinois", city: "Chicago", code: "4A2C", name: "Chicago South Side Recruiting Station", zipCode: "60609" },
  { state: "Illinois", city: "Chicago", code: "4A3C", name: "Chicago North Side Recruiting Station", zipCode: "60614" },
  { state: "Illinois", city: "Aurora", code: "4A4A", name: "Aurora Recruiting Station", zipCode: "60505" },
  { state: "Illinois", city: "Rockford", code: "4B1R", name: "Rockford Recruiting Station", zipCode: "61101" },
  { state: "Illinois", city: "Joliet", code: "4A5J", name: "Joliet Recruiting Station", zipCode: "60432" },
  { state: "Illinois", city: "Naperville", code: "4A6N", name: "Naperville Recruiting Station", zipCode: "60540" },
  { state: "Illinois", city: "Springfield", code: "4C1S", name: "Springfield Recruiting Station", zipCode: "62701" },

  // PENNSYLVANIA - Northeast Region 2, Metro B
  { state: "Pennsylvania", city: "Philadelphia", code: "2B1P", name: "Philadelphia Center City Recruiting Station", zipCode: "19102" },
  { state: "Pennsylvania", city: "Philadelphia", code: "2B2P", name: "Philadelphia North Recruiting Station", zipCode: "19140" },
  { state: "Pennsylvania", city: "Pittsburgh", code: "2C1P", name: "Pittsburgh Recruiting Station", zipCode: "15219" },
  { state: "Pennsylvania", city: "Allentown", code: "2D1A", name: "Allentown Recruiting Station", zipCode: "18101" },
  { state: "Pennsylvania", city: "Erie", code: "2E1E", name: "Erie Recruiting Station", zipCode: "16501" },
  { state: "Pennsylvania", city: "Reading", code: "2D2R", name: "Reading Recruiting Station", zipCode: "19601" },
  { state: "Pennsylvania", city: "Scranton", code: "2F1S", name: "Scranton Recruiting Station", zipCode: "18503" },

  // OHIO - Midwest Region 4, Metro B-D
  { state: "Ohio", city: "Columbus", code: "4B1C", name: "Columbus Recruiting Station", zipCode: "43215" },
  { state: "Ohio", city: "Cleveland", code: "4C1C", name: "Cleveland Recruiting Station", zipCode: "44113" },
  { state: "Ohio", city: "Cincinnati", code: "4D1C", name: "Cincinnati Recruiting Station", zipCode: "45202" },
  { state: "Ohio", city: "Toledo", code: "4C2T", name: "Toledo Recruiting Station", zipCode: "43604" },
  { state: "Ohio", city: "Akron", code: "4C3A", name: "Akron Recruiting Station", zipCode: "44308" },
  { state: "Ohio", city: "Dayton", code: "4D2D", name: "Dayton Recruiting Station", zipCode: "45402" },

  // GEORGIA - Southeast Region 3, Metro B
  { state: "Georgia", city: "Atlanta", code: "3B1A", name: "Atlanta Downtown Recruiting Station", zipCode: "30303" },
  { state: "Georgia", city: "Atlanta", code: "3B2A", name: "Atlanta Buckhead Recruiting Station", zipCode: "30326" },
  { state: "Georgia", city: "Augusta", code: "3F1A", name: "Augusta Recruiting Station", zipCode: "30901" },
  { state: "Georgia", city: "Columbus", code: "3F2C", name: "Columbus Recruiting Station", zipCode: "31901" },
  { state: "Georgia", city: "Savannah", code: "3F3S", name: "Savannah Recruiting Station", zipCode: "31401" },
  { state: "Georgia", city: "Athens", code: "3B3A", name: "Athens Recruiting Station", zipCode: "30601" },

  // NORTH CAROLINA - Southeast Region 3, Metro C
  { state: "North Carolina", city: "Charlotte", code: "3C1C", name: "Charlotte Recruiting Station", zipCode: "28202" },
  { state: "North Carolina", city: "Raleigh", code: "3C2R", name: "Raleigh Recruiting Station", zipCode: "27601" },
  { state: "North Carolina", city: "Greensboro", code: "3C3G", name: "Greensboro Recruiting Station", zipCode: "27401" },
  { state: "North Carolina", city: "Durham", code: "3C4D", name: "Durham Recruiting Station", zipCode: "27701" },
  { state: "North Carolina", city: "Winston-Salem", code: "3C5W", name: "Winston-Salem Recruiting Station", zipCode: "27101" },
  { state: "North Carolina", city: "Fayetteville", code: "3C6F", name: "Fayetteville Recruiting Station", zipCode: "28301" },

  // MICHIGAN - Midwest Region 4, Metro C
  { state: "Michigan", city: "Detroit", code: "4C1D", name: "Detroit Recruiting Station", zipCode: "48226" },
  { state: "Michigan", city: "Grand Rapids", code: "4E1G", name: "Grand Rapids Recruiting Station", zipCode: "49503" },
  { state: "Michigan", city: "Warren", code: "4C2W", name: "Warren Recruiting Station", zipCode: "48089" },
  { state: "Michigan", city: "Sterling Heights", code: "4C3S", name: "Sterling Heights Recruiting Station", zipCode: "48312" },
  { state: "Michigan", city: "Ann Arbor", code: "4C4A", name: "Ann Arbor Recruiting Station", zipCode: "48104" },
  { state: "Michigan", city: "Lansing", code: "4E2L", name: "Lansing Recruiting Station", zipCode: "48933" },

  // ARIZONA - West Region 6, Metro E
  { state: "Arizona", city: "Phoenix", code: "6E1P", name: "Phoenix Downtown Recruiting Station", zipCode: "85003" },
  { state: "Arizona", city: "Phoenix", code: "6E2P", name: "Phoenix North Recruiting Station", zipCode: "85020" },
  { state: "Arizona", city: "Tucson", code: "6E3T", name: "Tucson Recruiting Station", zipCode: "85701" },
  { state: "Arizona", city: "Mesa", code: "6E4M", name: "Mesa Recruiting Station", zipCode: "85201" },
  { state: "Arizona", city: "Chandler", code: "6E5C", name: "Chandler Recruiting Station", zipCode: "85225" },
  { state: "Arizona", city: "Scottsdale", code: "6E6S", name: "Scottsdale Recruiting Station", zipCode: "85251" },

  // WASHINGTON - West Region 6, Metro B
  { state: "Washington", city: "Seattle", code: "6B1S", name: "Seattle Downtown Recruiting Station", zipCode: "98101" },
  { state: "Washington", city: "Seattle", code: "6B2S", name: "Seattle North Recruiting Station", zipCode: "98103" },
  { state: "Washington", city: "Spokane", code: "6F1S", name: "Spokane Recruiting Station", zipCode: "99201" },
  { state: "Washington", city: "Tacoma", code: "6B3T", name: "Tacoma Recruiting Station", zipCode: "98402" },
  { state: "Washington", city: "Vancouver", code: "6F2V", name: "Vancouver Recruiting Station", zipCode: "98660" },
  { state: "Washington", city: "Bellevue", code: "6B4B", name: "Bellevue Recruiting Station", zipCode: "98004" },

  // MASSACHUSETTS - Northeast Region 2, Metro C
  { state: "Massachusetts", city: "Boston", code: "2C1B", name: "Boston Downtown Recruiting Station", zipCode: "02108" },
  { state: "Massachusetts", city: "Boston", code: "2C2B", name: "Boston South Recruiting Station", zipCode: "02118" },
  { state: "Massachusetts", city: "Worcester", code: "2C3W", name: "Worcester Recruiting Station", zipCode: "01608" },
  { state: "Massachusetts", city: "Springfield", code: "2C4S", name: "Springfield Recruiting Station", zipCode: "01103" },
  { state: "Massachusetts", city: "Cambridge", code: "2C5C", name: "Cambridge Recruiting Station", zipCode: "02138" },
  { state: "Massachusetts", city: "Lowell", code: "2C6L", name: "Lowell Recruiting Station", zipCode: "01852" },

  // TENNESSEE - South Region 5, Metro G
  { state: "Tennessee", city: "Nashville", code: "5G1N", name: "Nashville Recruiting Station", zipCode: "37201" },
  { state: "Tennessee", city: "Memphis", code: "5G2M", name: "Memphis Recruiting Station", zipCode: "38103" },
  { state: "Tennessee", city: "Knoxville", code: "5G3K", name: "Knoxville Recruiting Station", zipCode: "37902" },
  { state: "Tennessee", city: "Chattanooga", code: "5G4C", name: "Chattanooga Recruiting Station", zipCode: "37402" },
  { state: "Tennessee", city: "Clarksville", code: "5G5C", name: "Clarksville Recruiting Station", zipCode: "37040" },

  // INDIANA - Midwest Region 4, Metro D
  { state: "Indiana", city: "Indianapolis", code: "4D1I", name: "Indianapolis Recruiting Station", zipCode: "46204" },
  { state: "Indiana", city: "Fort Wayne", code: "4F1F", name: "Fort Wayne Recruiting Station", zipCode: "46802" },
  { state: "Indiana", city: "Evansville", code: "4D2E", name: "Evansville Recruiting Station", zipCode: "47708" },
  { state: "Indiana", city: "South Bend", code: "4F2S", name: "South Bend Recruiting Station", zipCode: "46601" },

  // MISSOURI - Midwest Region 4, Metro H
  { state: "Missouri", city: "Kansas City", code: "4H1K", name: "Kansas City Recruiting Station", zipCode: "64106" },
  { state: "Missouri", city: "St. Louis", code: "4H2S", name: "St. Louis Recruiting Station", zipCode: "63101" },
  { state: "Missouri", city: "Springfield", code: "4H3S", name: "Springfield Recruiting Station", zipCode: "65806" },
  { state: "Missouri", city: "Columbia", code: "4H4C", name: "Columbia Recruiting Station", zipCode: "65201" },

  // WISCONSIN - Midwest Region 4, Metro E
  { state: "Wisconsin", city: "Milwaukee", code: "4E1M", name: "Milwaukee Recruiting Station", zipCode: "53202" },
  { state: "Wisconsin", city: "Madison", code: "4E2M", name: "Madison Recruiting Station", zipCode: "53703" },
  { state: "Wisconsin", city: "Green Bay", code: "4E3G", name: "Green Bay Recruiting Station", zipCode: "54301" },

  // MARYLAND - Southeast Region 3, Metro G
  { state: "Maryland", city: "Baltimore", code: "3G1B", name: "Baltimore Recruiting Station", zipCode: "21201" },
  { state: "Maryland", city: "Silver Spring", code: "3G2S", name: "Silver Spring Recruiting Station", zipCode: "20910" },
  { state: "Maryland", city: "Frederick", code: "3G3F", name: "Frederick Recruiting Station", zipCode: "21701" },

  // MINNESOTA - Midwest Region 4, Metro F
  { state: "Minnesota", city: "Minneapolis", code: "4F1M", name: "Minneapolis Recruiting Station", zipCode: "55401" },
  { state: "Minnesota", city: "St. Paul", code: "4F2S", name: "St. Paul Recruiting Station", zipCode: "55102" },
  { state: "Minnesota", city: "Rochester", code: "4F3R", name: "Rochester Recruiting Station", zipCode: "55901" },

  // COLORADO - West Region 6, Metro G
  { state: "Colorado", city: "Denver", code: "6G1D", name: "Denver Downtown Recruiting Station", zipCode: "80202" },
  { state: "Colorado", city: "Denver", code: "6G2D", name: "Denver Aurora Recruiting Station", zipCode: "80010" },
  { state: "Colorado", city: "Colorado Springs", code: "6G3C", name: "Colorado Springs Recruiting Station", zipCode: "80903" },
  { state: "Colorado", city: "Fort Collins", code: "6G4F", name: "Fort Collins Recruiting Station", zipCode: "80521" },

  // ALABAMA - South Region 5, Metro F
  { state: "Alabama", city: "Birmingham", code: "5F1B", name: "Birmingham Recruiting Station", zipCode: "35203" },
  { state: "Alabama", city: "Montgomery", code: "5F2M", name: "Montgomery Recruiting Station", zipCode: "36104" },
  { state: "Alabama", city: "Mobile", code: "5F3M", name: "Mobile Recruiting Station", zipCode: "36602" },
  { state: "Alabama", city: "Huntsville", code: "5F4H", name: "Huntsville Recruiting Station", zipCode: "35801" },

  // SOUTH CAROLINA - Southeast Region 3, Metro D
  { state: "South Carolina", city: "Columbia", code: "3D1C", name: "Columbia Recruiting Station", zipCode: "29201" },
  { state: "South Carolina", city: "Charleston", code: "3D2C", name: "Charleston Recruiting Station", zipCode: "29401" },
  { state: "South Carolina", city: "Greenville", code: "3D3G", name: "Greenville Recruiting Station", zipCode: "29601" },

  // LOUISIANA - South Region 5, Metro D
  { state: "Louisiana", city: "New Orleans", code: "5D1N", name: "New Orleans Recruiting Station", zipCode: "70112" },
  { state: "Louisiana", city: "Baton Rouge", code: "5D2B", name: "Baton Rouge Recruiting Station", zipCode: "70801" },
  { state: "Louisiana", city: "Shreveport", code: "5D3S", name: "Shreveport Recruiting Station", zipCode: "71101" },
  { state: "Louisiana", city: "Lafayette", code: "5D4L", name: "Lafayette Recruiting Station", zipCode: "70501" },

  // KENTUCKY - South Region 5, Metro H
  { state: "Kentucky", city: "Louisville", code: "5H1L", name: "Louisville Recruiting Station", zipCode: "40202" },
  { state: "Kentucky", city: "Lexington", code: "5H2L", name: "Lexington Recruiting Station", zipCode: "40507" },
  { state: "Kentucky", city: "Bowling Green", code: "5H3B", name: "Bowling Green Recruiting Station", zipCode: "42101" },

  // OREGON - West Region 6, Metro C
  { state: "Oregon", city: "Portland", code: "6C1P", name: "Portland Recruiting Station", zipCode: "97204" },
  { state: "Oregon", city: "Eugene", code: "6C2E", name: "Eugene Recruiting Station", zipCode: "97401" },
  { state: "Oregon", city: "Salem", code: "6C3S", name: "Salem Recruiting Station", zipCode: "97301" },

  // OKLAHOMA - South Region 5, Metro B
  { state: "Oklahoma", city: "Oklahoma City", code: "5B1O", name: "Oklahoma City Recruiting Station", zipCode: "73102" },
  { state: "Oklahoma", city: "Tulsa", code: "5B2T", name: "Tulsa Recruiting Station", zipCode: "74103" },
  { state: "Oklahoma", city: "Norman", code: "5B3N", name: "Norman Recruiting Station", zipCode: "73069" },

  // CONNECTICUT - Northeast Region 2, Metro D
  { state: "Connecticut", city: "Hartford", code: "2D1H", name: "Hartford Recruiting Station", zipCode: "06103" },
  { state: "Connecticut", city: "New Haven", code: "2D2N", name: "New Haven Recruiting Station", zipCode: "06510" },
  { state: "Connecticut", city: "Stamford", code: "2D3S", name: "Stamford Recruiting Station", zipCode: "06901" },
  { state: "Connecticut", city: "Bridgeport", code: "2D4B", name: "Bridgeport Recruiting Station", zipCode: "06604" },

  // IOWA - Midwest Region 4, Metro G
  { state: "Iowa", city: "Des Moines", code: "4G1D", name: "Des Moines Recruiting Station", zipCode: "50309" },
  { state: "Iowa", city: "Cedar Rapids", code: "4G2C", name: "Cedar Rapids Recruiting Station", zipCode: "52401" },
  { state: "Iowa", city: "Davenport", code: "4G3D", name: "Davenport Recruiting Station", zipCode: "52801" },

  // UTAH - West Region 6, Metro H
  { state: "Utah", city: "Salt Lake City", code: "6H1S", name: "Salt Lake City Recruiting Station", zipCode: "84101" },
  { state: "Utah", city: "West Valley City", code: "6H2W", name: "West Valley City Recruiting Station", zipCode: "84119" },
  { state: "Utah", city: "Provo", code: "6H3P", name: "Provo Recruiting Station", zipCode: "84601" },

  // NEVADA - West Region 6, Metro D
  { state: "Nevada", city: "Las Vegas", code: "6D1L", name: "Las Vegas Downtown Recruiting Station", zipCode: "89101" },
  { state: "Nevada", city: "Las Vegas", code: "6D2L", name: "Las Vegas North Recruiting Station", zipCode: "89030" },
  { state: "Nevada", city: "Reno", code: "6D3R", name: "Reno Recruiting Station", zipCode: "89501" },
  { state: "Nevada", city: "Henderson", code: "6D4H", name: "Henderson Recruiting Station", zipCode: "89002" },

  // ARKANSAS - South Region 5, Metro C
  { state: "Arkansas", city: "Little Rock", code: "5C1L", name: "Little Rock Recruiting Station", zipCode: "72201" },
  { state: "Arkansas", city: "Fort Smith", code: "5C2F", name: "Fort Smith Recruiting Station", zipCode: "72901" },
  { state: "Arkansas", city: "Fayetteville", code: "5C3F", name: "Fayetteville Recruiting Station", zipCode: "72701" },

  // MISSISSIPPI - South Region 5, Metro E
  { state: "Mississippi", city: "Jackson", code: "5E1J", name: "Jackson Recruiting Station", zipCode: "39201" },
  { state: "Mississippi", city: "Gulfport", code: "5E2G", name: "Gulfport Recruiting Station", zipCode: "39501" },
  { state: "Mississippi", city: "Biloxi", code: "5E3B", name: "Biloxi Recruiting Station", zipCode: "39530" },

  // KANSAS - Midwest Region 4, Metro I
  { state: "Kansas", city: "Wichita", code: "4I1W", name: "Wichita Recruiting Station", zipCode: "67202" },
  { state: "Kansas", city: "Overland Park", code: "4I2O", name: "Overland Park Recruiting Station", zipCode: "66204" },
  { state: "Kansas", city: "Kansas City", code: "4I3K", name: "Kansas City Recruiting Station", zipCode: "66101" },

  // NEW MEXICO - West Region 6, Metro F
  { state: "New Mexico", city: "Albuquerque", code: "6F1A", name: "Albuquerque Recruiting Station", zipCode: "87102" },
  { state: "New Mexico", city: "Las Cruces", code: "6F2L", name: "Las Cruces Recruiting Station", zipCode: "88001" },
  { state: "New Mexico", city: "Santa Fe", code: "6F3S", name: "Santa Fe Recruiting Station", zipCode: "87501" },

  // NEBRASKA - Midwest Region 4, Metro J
  { state: "Nebraska", city: "Omaha", code: "4J1O", name: "Omaha Recruiting Station", zipCode: "68102" },
  { state: "Nebraska", city: "Lincoln", code: "4J2L", name: "Lincoln Recruiting Station", zipCode: "68508" },

  // WEST VIRGINIA - Southeast Region 3, Metro F
  { state: "West Virginia", city: "Charleston", code: "3F1C", name: "Charleston Recruiting Station", zipCode: "25301" },
  { state: "West Virginia", city: "Huntington", code: "3F2H", name: "Huntington Recruiting Station", zipCode: "25701" },

  // IDAHO - West Region 6, Metro I
  { state: "Idaho", city: "Boise", code: "6I1B", name: "Boise Recruiting Station", zipCode: "83702" },
  { state: "Idaho", city: "Meridian", code: "6I2M", name: "Meridian Recruiting Station", zipCode: "83642" },

  // HAWAII - Pacific Region 7, Metro B
  { state: "Hawaii", city: "Honolulu", code: "7B1H", name: "Honolulu Recruiting Station", zipCode: "96813" },
  { state: "Hawaii", city: "Pearl City", code: "7B2P", name: "Pearl City Recruiting Station", zipCode: "96782" },
  { state: "Hawaii", city: "Hilo", code: "7B3H", name: "Hilo Recruiting Station", zipCode: "96720" },

  // MAINE - Northeast Region 2, Metro H
  { state: "Maine", city: "Portland", code: "2H1P", name: "Portland Recruiting Station", zipCode: "04101" },
  { state: "Maine", city: "Lewiston", code: "2H2L", name: "Lewiston Recruiting Station", zipCode: "04240" },

  // NEW HAMPSHIRE - Northeast Region 2, Metro G
  { state: "New Hampshire", city: "Manchester", code: "2G1M", name: "Manchester Recruiting Station", zipCode: "03101" },
  { state: "New Hampshire", city: "Nashua", code: "2G2N", name: "Nashua Recruiting Station", zipCode: "03060" },

  // RHODE ISLAND - Northeast Region 2, Metro E
  { state: "Rhode Island", city: "Providence", code: "2E1P", name: "Providence Recruiting Station", zipCode: "02903" },
  { state: "Rhode Island", city: "Warwick", code: "2E2W", name: "Warwick Recruiting Station", zipCode: "02886" },

  // MONTANA - West Region 6, Metro J
  { state: "Montana", city: "Billings", code: "6J1B", name: "Billings Recruiting Station", zipCode: "59101" },
  { state: "Montana", city: "Missoula", code: "6J2M", name: "Missoula Recruiting Station", zipCode: "59801" },

  // DELAWARE - Southeast Region 3, Metro H
  { state: "Delaware", city: "Wilmington", code: "3H1W", name: "Wilmington Recruiting Station", zipCode: "19801" },
  { state: "Delaware", city: "Dover", code: "3H2D", name: "Dover Recruiting Station", zipCode: "19901" },

  // SOUTH DAKOTA - Midwest Region 4, Metro L
  { state: "South Dakota", city: "Sioux Falls", code: "4L1S", name: "Sioux Falls Recruiting Station", zipCode: "57104" },
  { state: "South Dakota", city: "Rapid City", code: "4L2R", name: "Rapid City Recruiting Station", zipCode: "57701" },

  // NORTH DAKOTA - Midwest Region 4, Metro K
  { state: "North Dakota", city: "Fargo", code: "4K1F", name: "Fargo Recruiting Station", zipCode: "58102" },
  { state: "North Dakota", city: "Bismarck", code: "4K2B", name: "Bismarck Recruiting Station", zipCode: "58501" },

  // ALASKA - Pacific Region 7, Metro A
  { state: "Alaska", city: "Anchorage", code: "7A1A", name: "Anchorage Recruiting Station", zipCode: "99501" },
  { state: "Alaska", city: "Fairbanks", code: "7A2F", name: "Fairbanks Recruiting Station", zipCode: "99701" },

  // VERMONT - Northeast Region 2, Metro F
  { state: "Vermont", city: "Burlington", code: "2F1B", name: "Burlington Recruiting Station", zipCode: "05401" },
  { state: "Vermont", city: "Rutland", code: "2F2R", name: "Rutland Recruiting Station", zipCode: "05701" },

  // WYOMING - West Region 6, Metro K
  { state: "Wyoming", city: "Cheyenne", code: "6K1C", name: "Cheyenne Recruiting Station", zipCode: "82001" },
  { state: "Wyoming", city: "Casper", code: "6K2C", name: "Casper Recruiting Station", zipCode: "82601" },

  // NEW JERSEY - Northeast Region 2, Metro A
  { state: "New Jersey", city: "Newark", code: "2A1N", name: "Newark Recruiting Station", zipCode: "07102" },
  { state: "New Jersey", city: "Jersey City", code: "2A2J", name: "Jersey City Recruiting Station", zipCode: "07302" },
  { state: "New Jersey", city: "Paterson", code: "2A3P", name: "Paterson Recruiting Station", zipCode: "07505" },
  { state: "New Jersey", city: "Elizabeth", code: "2A4E", name: "Elizabeth Recruiting Station", zipCode: "07201" },
  { state: "New Jersey", city: "Trenton", code: "2A5T", name: "Trenton Recruiting Station", zipCode: "08608" },

  // VIRGINIA - Southeast Region 3, Metro E
  { state: "Virginia", city: "Virginia Beach", code: "3E1V", name: "Virginia Beach Recruiting Station", zipCode: "23451" },
  { state: "Virginia", city: "Norfolk", code: "3E2N", name: "Norfolk Recruiting Station", zipCode: "23510" },
  { state: "Virginia", city: "Chesapeake", code: "3E3C", name: "Chesapeake Recruiting Station", zipCode: "23320" },
  { state: "Virginia", city: "Richmond", code: "3E4R", name: "Richmond Recruiting Station", zipCode: "23219" },
  { state: "Virginia", city: "Arlington", code: "3E5A", name: "Arlington Recruiting Station", zipCode: "22201" },
];

// Total: 215 major city recruiting stations
export const TOTAL_MAJOR_CITIES = MAJOR_CITIES_STATIONS.length;

// For admin assignment (NYC codes)
export const NYC_STATION_CODES = ["1G1A", "1G2B", "1G3Q", "1G4X", "1G5S"];

// Get stations by state (for dropdown filtering)
export function getStationsByState(state: string) {
  return MAJOR_CITIES_STATIONS.filter(s => s.state === state);
}

// Get all unique states
export function getUniqueStates() {
  return [...new Set(MAJOR_CITIES_STATIONS.map(s => s.state))].sort();
}

