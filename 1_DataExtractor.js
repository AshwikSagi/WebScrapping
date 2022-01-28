// // npm init -y
// // npm install minimist
// // npm install axios
// // npm install jsdom
// // npm install excel4node
// // npm install pdf-lib
// // node 1_DataExtractor.js --excel=WorldCup.csv --dataFolder=data --source="https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-results" 

// let minimist=require("minimist");
// let axios=require("axios");
// let jsdom=require("jsdom");
// let excel4node=require("excel4node");
// let pdf=require("pdf-lib");
// const { MissingPageContentsEmbeddingError } = require("pdf-lib");
// let args=minimist(process.argv);

// // console.log(args.source);
// // console.log(args.excel);
// // console.log(args.dataFolder);

// // Download using axios
// // Read using jsdom
// // Make excel using excel4node
// // make pdf using pdf-lib

// let PromiseForResponse = axios.get(args.source);
// PromiseForResponse.then(function(response){
//     let html=response.data;
//     // console.log(html);
//     let dom=new jsdom.JSDOM(html);
//     let document=dom.window.document;
//     let matches=[];
//     let matchesScoredivs=document.querySelectorAll("div.match-score-block");
//     // console.log(matchesScoredivs.length);
//     for(let i=0;i<matchesScoredivs.length;i++){
//         let match={};

//         let namePs=matchesScoredivs[i].querySelectorAll("p.name");
//         match.t1=namePs[0].textContent;
//         match.t2=namePs[1].textContent;

//         let scoreSpans=matchesScoredivs[i].querySelectorAll("div.score-detail>span.score");
//         if(scoreSpans.length==2){
//             match.team1Score=scoreSpans[0].textContent;
//             match.team2Score=scoreSpans[1].textContent;
//         }
//         else if(scoreSpans.length==1){
//             match.team1Score=scoreSpans[0].textContent;
//             match.team2Score="";
//         }
//         else{
//             match.team1Score="";
//             match.team2Score="";
//         }

//         let spanResult=matchesScoredivs[i].querySelector("div.status-text>span");
//         match.result=spanResult.textContent;
//         matches.push(match);
//     }
//     console.log(matches);

// }).catch(function(err){
//     console.log("Data not found at the given url");
// });

// the purpose of this project is to extract information of worldcup 2019 from cricinfo and present
// that in the form of excel and pdf scorecards
// the real purpose is to learn how to extract information and get experience with js
// A very good reason to ever make a project is to have good fun

// npm init -y
// npm install minimist
// npm install axios
// npm install jsdom
// npm install excel4node
// npm install pdf-lib

// node 1_CricinfoExtracter.js --excel=Worldcup.csv --dataFolder=data --source=https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-results 

let minimist = require("minimist");
let axios = require("axios");
let jsdom = require("jsdom");
let excel = require("excel4node");
let pdf = require("pdf-lib");
let fs = require("fs");
let path = require("path");

let args = minimist(process.argv);

// download using axios
// extract information using jsdom
// manipulate data using array functions
// save in excel using excel4node
// create folders and prepare pdfs

let PromiseForResponse = axios.get(args.source);
PromiseForResponse.then(function (response) {
    let html = response.data;

    let dom = new jsdom.JSDOM(html);
    let document = dom.window.document;

    let matches = [];
    let matchdivs = document.querySelectorAll("div.match-score-block");
    for (let i = 0; i < matchdivs.length; i++) {
        let matchdiv = matchdivs[i];
        let match = {
            t1: "",
            t2: "",
            t1s: "",
            t2s: "",
            result: ""
        };

        let teamParas = matchdiv.querySelectorAll("div.name-detail > p.name");
        match.t1 = teamParas[0].textContent;
        match.t2 = teamParas[1].textContent;

        let scoreSpans = matchdiv.querySelectorAll("div.score-detail > span.score");
        if (scoreSpans.length == 2) {
            match.t1s = scoreSpans[0].textContent;
            match.t2s = scoreSpans[1].textContent;
        } else if (scoreSpans.length == 1) {
            match.t1s = scoreSpans[0].textContent;
            match.t2s = "";
        } else {
            match.t1s = "";
            match.t2s = "";
        }

        let resultSpan = matchdiv.querySelector("div.status-text > span");
        match.result = resultSpan.textContent;

        matches.push(match);
    }

    let matchesJSON = JSON.stringify(matches); // done
    fs.writeFileSync("matches.json", matchesJSON, "utf-8"); // done

    let teams = []; // done
    for (let i = 0; i < matches.length; i++) {
        putTeamInTeamsArrayIfMissing(teams, matches[i]); // done
    }

    for (let i = 0; i < matches.length; i++) {
        putMatchInAppropriateTeam(teams, matches[i]); // done
    }

    let teamsJSON = JSON.stringify(teams); // done
    fs.writeFileSync("teams.json", teamsJSON, "utf-8"); // done

    createExcelFile(teams);
    createFolders(teams);
})

function createFolders(teams) {
    fs.mkdirSync
    (args.dataFolder);
    for (let i = 0; i < teams.length; i++) {
        let teamFN = path.join(args.dataFolder, teams[i].name);
        fs.mkdirSync(teamFN);

        for (let j = 0; j < teams[i].matches.length; j++) {
            let matchFileName = path.join(teamFN, teams[i].matches[j].opponent + ".pdf");
            createScoreCard(teams[i].name, teams[i].matches[j], matchFileName);
        }
    }
}

function createScoreCard(teamName, match, matchFileName) {
    let t1 = teamName;
    let t2 = match.opponent;
    let t1s = match.selfScore;
    let t2s = match.oppScore;
    let result = match.result;

    let bytesOfPDFTemplate = fs.readFileSync("Template.pdf");
    let pdfdocKaPromise = pdf.PDFDocument.load(bytesOfPDFTemplate);
    pdfdocKaPromise.then(function(pdfdoc){
        let page = pdfdoc.getPage(0);

        page.drawText(t1, {
            x: 320,
            y: 729,
            size: 8
        });
        page.drawText(t2, {
            x: 320,
            y: 715,
            size: 8
        });
        page.drawText(t1s, {
            x: 320,
            y: 701,
            size: 8
        });
        page.drawText(t2s, {
            x: 320,
            y: 687,
            size: 8
        });
        page.drawText(result, {
            x: 320,
            y: 673,
            size: 8
        });

        let finalPDFBytesKaPromise = pdfdoc.save();
        finalPDFBytesKaPromise.then(function(finalPDFBytes){
            fs.writeFileSync(matchFileName, finalPDFBytes);
        })
    })
}

function createExcelFile(teams) {
    let wb = new excel.Workbook();

    for (let i = 0; i < teams.length; i++) {
        let sheet = wb.addWorksheet(teams[i].name);

        sheet.cell(1, 1).string("Opponent");
        sheet.cell(1, 2).string("Self Score");
        sheet.cell(1, 3).string("Opp Score");
        sheet.cell(1, 4).string("Result");
        for (let j = 0; j < teams[i].matches.length; j++) {
            sheet.cell(2 + j, 1).string(teams[i].matches[j].opponent);
            sheet.cell(2 + j, 2).string(teams[i].matches[j].selfScore);
            sheet.cell(2 + j, 3).string(teams[i].matches[j].oppScore);
            sheet.cell(2 + j, 4).string(teams[i].matches[j].result);
        }
    }

    wb.write(args.excel);
}

function putTeamInTeamsArrayIfMissing(teams, match) {
    let t1idx = -1;
    for (let i = 0; i < teams.length; i++) {
        if (teams[i].name == match.t1) {
            t1idx = i;
            break;
        }
    }

    if (t1idx == -1) {
        teams.push({
            name: match.t1,
            matches: []
        });
    }

    let t2idx = -1;
    for (let i = 0; i < teams.length; i++) {
        if (teams[i].name == match.t2) {
            t2idx = i;
            break;
        }
    }

    if (t2idx == -1) {
        teams.push({
            name: match.t2,
            matches: []
        });
    }
}

function putMatchInAppropriateTeam(teams, match) {
    let t1idx = -1;
    for (let i = 0; i < teams.length; i++) {
        if (teams[i].name == match.t1) {
            t1idx = i;
            break;
        }
    }

    let team1 = teams[t1idx];
    team1.matches.push({
        opponent: match.t2,
        selfScore: match.t1s,
        oppScore: match.t2s,
        result: match.result
    });

    let t2idx = -1;
    for (let i = 0; i < teams.length; i++) {
        if (teams[i].name == match.t2) {
            t2idx = i;
            break;
        }
    }

    let team2 = teams[t2idx];
    team2.matches.push({
        opponent: match.t1,
        selfScore: match.t2s,
        oppScore: match.t1s,
        result: match.result
    });
}
