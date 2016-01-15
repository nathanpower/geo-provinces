var request = require('request'),
    async = require('async'),
    _ = require('lodash'),
    fs = require('fs'),
	fileISOCodes=fs.readFileSync("\isoCodes.txt", 'utf8', function (err,data) {
	console.log(data);
	  if (err) {
		return err;
	  }
		return console.log(data);
	});
	
var countryISOCodes=fileISOCodes.split(', ');
var countryFunctions = [];
countryISOCodes.map(function (isoCode) {
    countryFunctions.push(function (cb) {
        return request('http://api.geonames.org/countryInfo?username=nathanpower&country=' + isoCode + '&type=json', function (error, response, body) {
            var result = JSON.parse(body);
            if (!error && response.statusCode == 200 && result.geonames[0]) {
                cb(null, {"id": result.geonames[0].geonameId, "iso": isoCode});
            } else {
                throw new Error('Invalid response for ISO code ' + isoCode);
            }
        })
    })
});

async.series(countryFunctions, function (err, countryGeonameIds) {
    var provinceFunctions = [];
    countryGeonameIds.map(function(countryObj,i,e){
	    provinceFunctions.push(function (cb) {
            request('http://api.geonames.org/children?geonameId=' + countryObj.id + '&username=nathanpower&type=json&lang=' + countryObj.iso, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var result = JSON.parse(body);
                    cb(null, result.geonames)
                }
            });
        });
    });
	async.series(provinceFunctions, function (err, countryProvinces) {
		var countryProvinceData = countryProvinces.map(function(o,i,e){
					return o[i].countryCode+':['+o.map(function(o,i,e){
						return o.toponymName;
					})+']';
				});		
				var parsed=JSON.parse('"{'+countryProvinceData.toString()+'}"');				
				fs.writeFile('provinces.json', parsed, 'utf-8');									
        });		
    });