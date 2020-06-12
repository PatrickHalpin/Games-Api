var express = require("express");
var app = express();
var promise = require("promise");
const request = require('request');
const cors = require('cors');

var today = new Date();
var dd = String(today.getDate()).padStart(2, '0');
var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
var lm = String(today.getMonth()).padStart(2, '0'); //get previous month
var yyyy = today.getFullYear();

today = dd + '.' + mm + '.' + yyyy;
fromDate =  dd + '.' + lm + '.' + yyyy;

///// hold data
var gameWeekGames = null;
var currentGames = null
var todaysGames = null;
var lastMonthsGames = null;
var displayGames = null;
var lastGameDate = null;
var gw = 1;

///////////////////////////////////////
//Games methods
///////////////////////////////////////

function loadGameWeekGames()
{
  return new Promise(function(resolve, reject)
  {
    console.log("Loading Games for Game Week... " + gw);
    var games = JSON.parse(lastMonthsGames);
    var weeksGames=[];
      for(var q = games.length -1; q>=0;q--)
      {
        if(games[q].week==gw)
        {
          weeksGames.push(games[q]);
        }
      }
      resolve(weeksGames);
  });
}


function loadGamesForToday()
{
  console.log("Loading Todays Games...");
  var prom = getGamesForDate(today);
  prom.then(function(result)
  {
    return result;
  },
  function(err)
  {
    console.log(err);
  });
}

function getGamesForDate(date)
{
  console.log('Getting games for ' + date);
  return new Promise(function(resolve, reject)
  {
    request('http://api.football-api.com/2.0/matches?comp_id=1204&match_date='+date+'&Authorization=565ec012251f932ea400000113e3196b0a6f4dbe6071ed4fd60e926e',function (error, response, body)
    {
      if (!error && response.statusCode == 200)
      {
        console.log('Retruning Games for ' + date);
        resolve(body);
      }
      else
      {
        console.log('No games for ' + date)
        resolve(null);
      }
    });
  });
}

function loadGamesForLastMonth()
{
  console.log("Loading Past Games...");
  return new Promise(function(resolve, reject)
  {
    request('http://api.football-api.com/2.0/matches?comp_id=1204&from_date='+fromDate+'&to_date='+today+'&Authorization=565ec012251f932ea400000113e3196b0a6f4dbe6071ed4fd60e926e',function (error, response, body)
    {
      if (!error && response.statusCode == 200)
      {
        console.log('Returning games from '+ fromDate + ' to ' + today);
        resolve(body);
      }
      else
      {
        console.log('ERROR: Returning games from '+ fromDate + ' to ' + today);
        reject(null);
      }
    });
  });
}


function loadDisplayGames()
{
  return new Promise(function(resolve, reject)
  {
    console.log("Loading Display Games...");
    if(currentGames!=null)
    {
      console.log("Display Games: CurrentGames");
      resolve(currentGames);
    }
    else if(todaysGames!=null)
    {
      console.log("Display Games: TodaysGames");
      resolve(todaysGames);
    }
    else
    {
        var promD = getGamesForDate(getDate);
        promD.then(function(result)
        {
          console.log("Display Games: Games on " + getDate);
          resolve(result);
        },
        function(err)
        {
          console.log(err);
          reject(null);
        });
      }
  })
}

///// API CALLS /////

//Gets what games to display
//Either Live games, games from today or the last available games
app.get("/displayGames", cors(), (req, res, next) => {
    res.send(displayGames);
});

//Gets games from today
app.get("/getGamesToday", cors(), (req, res, next) => {
    res.send(todaysGames);
});

//Gets all games from the last month
app.get("/getLastMonthsGames", cors(), (req, res, next) => {
    res.send(lastMonthsGames);
});

//Gets the current league table
app.get("/getTable", cors(), (req, res, next) => {
    res.send(null);
});

//Gets games from the current round
app.get("/getLastRoundGames", cors(), (req, res, next) => {
    res.send(gameWeekGames);
});

//Gets GameWeek number
app.get("/getGameWeek", cors(), (req, res, next) => {
    res.send(gw);
});

//Gets Date of last played Fixture(s)
app.get("/getLastGameDate", cors(), (req, res, next) => {
    res.send(lastGameDate);
});

/////

/////

function loadKeyData()
{
  return new Promise(function(resolve, reject)
  {
    var prom2 = getGamesForDate(today);

    prom2.then(function(result) {
        todaysGames = result;

        var prom3 = loadGamesForLastMonth();

        prom3.then(function(result2) {
            lastMonthsGames = result2;
            resolve();
          }, function(err2) {
                console.log('Error: ' + err2);
                lastMonthsGames = null;
                resolve();
            });

        }, function(err) {
            console.log('Error: ' + err);
            todaysGames = null;
            resolve();
        });
  });
}

function setGameWeek()
{
  var games = JSON.parse(lastMonthsGames);
  if(games.length==0)
  {
    console.log("error");
    reject(null);
  }

  else
  {
    var week;
    for(var g = games.length -1; g>=0;g--)
    {
      if(games[g].status=='FT')
      {
        week = games[g].week;
        return week;
      }
    }
  }
}

function setLastGameDate()
{
  var games = JSON.parse(lastMonthsGames);
  if(games.length==0)
  {
    console.log("error");
    reject(null);
  }

  else
  {
    var getdate;
    for(var g = games.length -1; g>=0;g--)
    {
      if(games[g].status=='FT')
      {
        getDate = games[g].formatted_date;
        return getDate;
      }
    }
  }
}

function setDateDetails()
{
  return new Promise(function(resolve, reject)
  {
    gw = setGameWeek();
    lastGameDate = setLastGameDate();
    resolve();
  });
}


/////
function init()
{
  console.log('Loading Data...');

  var prom = loadKeyData();

  prom.then(function(result) {

          var promSetDateDetails = setDateDetails();
          promSetDateDetails.then(function(dateDetailsResults) {

            var promGwGames = loadGameWeekGames();
            promGwGames.then(function(gwGamesResult) {

            gameWeekGames=gwGamesResult;

          }, function(gwGamesErr) {
                    console.log(gwGamesErr);
                });


            var promDis = loadDisplayGames();
            promDis.then(function(result2) {
            displayGames=result2;
            }, function(err2) {
                    console.log(err2);
                });

        }, function(err) {
            console.log(err);
        });

          }, function(dateDetailsErr) {
                  console.log(dateDetailsErr);
              });
}

/////
app.listen(8080, () => {
 console.log("Server running on port 8080");
 console.log(today);
 init();
 //recall every min??
 //use ajax to refresh page??
 //get table??

});
