var request = require('request'),
    async = require('async'),
    _ = require('lodash'),
    fs = require('fs');

var countryISOCodes = ['IT', 'AT', 'CH', 'ES', 'FR', 'DE', 'AR'];
var countryFunctions = [];
countryISOCodes.map(function (isoCode) {
    countryFunctions.push(function (cb) {
        return request('http://api.geonames.org/countryInfo?username=nathanpower&country=' + isoCode + '&type=json', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var result = JSON.parse(body);
                cb(null, {"id": result.geonames[0].geonameId, "iso": isoCode});
            }
        })
    })
});

async.series(countryFunctions, function (err, countryGeonameIds) {
    var provinceFunctions = [];
    _.forEach(countryGeonameIds, function (countryObj) {
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
        var countryProvinceData = countryProvinces.map(function (provinces) {
            var obj = {};
            obj[provinces[0].countryCode] = [];
            _.forEach(provinces, function (province) {
                obj[provinces[0].countryCode].push(province.toponymName);
            });
            return obj
        });
        fs.writeFile('./provinces.json', JSON.stringify(countryProvinceData, null, 2), 'utf-8');
        console.log('finished!');
    });
});



