

const WebSocket = require('ws');
const axios = require('axios');

var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('test.properties');


const wss = new WebSocket.Server({ port: 8080 });

wss.on("connection", (ws, req) => {
  console.log(`"SERVER: Connection established" ${req.url}`);

  var atlasUrl = JSON.parse(req.url.substring(1)).atlasUrl;
  var playerId = JSON.parse(req.url.substring(1)).playerId;
  var playerSecret = JSON.parse(req.url.substring(1)).playerSecret;
  var gameId = JSON.parse(req.url.substring(1)).gameId;

  const data = {
    "game_id": gameId,
    "game_session_id": playerSecret,
    "user_id": playerId,
    "game_signature": generateGameSign()
  };

  axios.post(atlasUrl + '/api/providers/lone_star/auth_user', data)
    .then((res) => {
      console.log(`Status: ${res.status}`);
      if (res.status == 200) {
        console.log('Body: ');
        var response = properties.get("res_gameConfig");
        ws.send(response);
      } else {
        ws.send(" Status code :", res.status);
      }
    }).catch((err) => {
      console.error(err);
    });


  ws.on('message', message => {
    console.log(`Received message => ${message}`)
    if (message.includes('"sId":3000')) {
      const headers = {
        'Content-Type': 'application/json',
        'Host': 'rgs.igaming-qa.aristocrat-interactive.com'
      }
      const data = {
        "game_id": gameId,
        "game_session_id": playerSecret,
        "token": generateToken(),
        "user_id": playerId,
        "wager": 0.5,
        "win": 0.5,
        "wager_per_level": [],
        "mission_results": "{\"global_paylines_with_match_requirement\":[0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],\"num_win_lines\":1,\"symbols\":[[false,9,0,4,[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],0],[false,1,0,1,[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],0],[false,7,50,2,[0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],2],[false,4,0,3,[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],0],[true,13,50,1,[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],0],[false,11,0,1,[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],0],[false,3,0,2,[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],0],[false,6,0,1,[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],0]],\"reel_face\":[[{\"-1\":\"Undefined\"},{\"-1\":\"Undefined\"},{\"9\":\"Pic4\"},{\"1\":\"Ace\"},{\"7\":\"Pic2\"}],[{\"-1\":\"Undefined\"},{\"-1\":\"Undefined\"},{\"9\":\"Pic4\"},{\"4\":\"Jack\"},{\"13\":\"Wild\"}],[{\"-1\":\"Undefined\"},{\"-1\":\"Undefined\"},{\"11\":\"Pic6\"},{\"3\":\"Queen\"},{\"7\":\"Pic2\"}],[{\"-1\":\"Undefined\"},{\"-1\":\"Undefined\"},{\"4\":\"Jack\"},{\"9\":\"Pic4\"},{\"3\":\"Queen\"}],[{\"-1\":\"Undefined\"},{\"-1\":\"Undefined\"},{\"6\":\"Pic1\"},{\"4\":\"Jack\"},{\"9\":\"Pic4\"}]],\"total_award\":50,\"win_combos\":[[50,[],[[0,4],[1,4],[2,4]]]],\"bet\":[50,1,50],\"custom_game_outcome\":{\"totalBet\":\"50 Credits\",\"denom\":\"1Â¢\",\"totalWin\":\"50 Credits\",\"freeSpinsAwarded\":\"No\",\"wildBonusTriggered\":\"No\",\"ways\":\"243\",\"winCombinations\":\"3 Pic2 wins 50 credits\",\"legends\":{\"symbolDescription\":\"Pic1 : Samurai, Pic2 : Geisha, Pic3 : Horse, Pic4 : Drum, Pic5 : Mountain, Pic6 : Gate, Scatter : Free Games, x2 : Wild2, x3 : Wild3, -- : Position not applicable\"}}}",
        "game_signature": generateGameSign()
      };

      axios.post(atlasUrl + '/api/providers/lone_star/process_spin', data, {
        headers: headers
      })
        .then((res) => {
          console.log("Spin Request Status Code:", res.status);
          if (res.status == 200) {
            var reqID = JSON.parse(message)[0].rId;
            var response = properties.get("res_sId_3000").replace("RID", reqID).replace("PLAYERSECRET", playerSecret)
              .replace("PLAYERID", playerId).replace("GAMEID", gameId).replace("RANDOMTOKEN", generateToken());
            ws.send(response);
          } else {
            ws.send(" Status code :", res.status);
          }
        })
        .catch((error) => {
          console.error(err);
        })


    }
    else if (message.includes('"sId":1')) {
      var reqID = JSON.parse(message)[0].rId;
      var response = properties.get("res_sId_1").replace("RID", reqID);;
      ws.send(response);

    }
    else {
      console.log('Received Error Message')
      ws.send('This is process Spin');
    }
  });

  ws.on("close", () => {
    console.log("Client has been closed");
  });


})

function generateToken() {
  return Math.floor(1000000000000 + Math.random() * 9000000000000);
}

function generateGameSign() {
  let characters = '0123456789abcdefghijklmnopqrstuvwxyz';
  let result = '';
  let length = 36 // Customize the length here.
  for (let i = length; i > 0; --i)
    result += characters[Math.round(Math.random() * (characters.length - 1))];

  return result;
}