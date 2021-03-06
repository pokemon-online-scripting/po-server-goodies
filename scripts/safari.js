/*jshint "laxbreak":true,"shadow":true,"undef":true,"evil":true,"trailing":true,"proto":true,"withstmt":true*/
/*global sys, module, SESSION, script, safaribot, require, staffchannel */

var MemoryHash = require("memoryhash.js").MemoryHash;
var utilities = require('utilities.js');
var html_escape = utilities.html_escape;
var Bot = require('bot.js').Bot;

function Safari() {
    var safari = this;
    var safariUpdating = false;
    var safchan;
    var defaultChannel = "Safari";
    var saveFiles = "scriptdata/safarisaves.txt";
    var tradeLog = "scriptdata/safaritrades.txt";
    var shopLog = "scriptdata/safarishoplog.txt";
    var auctionLog = "scriptdata/safariauctions.txt";
    var altLog = "scriptdata/safarialtlog.txt";
    var lostLog = "scriptdata/safaricommands.txt";
    var tradebansFile = "scriptdata/safaribans.txt";
    var permFile = "scriptdata/safariobjects.txt";
    var permObj;
    var tradeBans;
    var rawPlayers;
    var npcShop;
    var lastIdAssigned;

    var safaribot = new Bot("Tauros");

    var shinyChance = 1024; //Chance for Shiny Pokémon
    var starters = [1, 4, 7];
    var currentPokemon = null;
    var currentPokemonCount = 1;
    var maxThrows = 20;
    var currentThrows;

    var tradeRequests = {};
    var challengeRequests = {};
    var currentBattles = [];
    var currentAuctions = [];
    var gachaJackpotAmount = 100; //Jackpot for gacha tickets. Number gets divided by 10 later.
    var gachaJackpot = (SESSION.global() && SESSION.global().safariGachaJackpot ? SESSION.global().safariGachaJackpot : gachaJackpotAmount);
    var leaderboards = {};
    var lastLeaderboardUpdate;

    var contestCooldownLength = 1800; //1 contest every 30 minutes
    var baitCooldownLength = 0;
    var releaseCooldownLength = 180; //1 release every 3 minutes
    var contestBroadcast = true; //Determines whether Tohjo gets notified
    var contestCooldown = (SESSION.global() && SESSION.global().safariContestCooldown ? SESSION.global().safariContestCooldown : contestCooldownLength);
    var baitCooldown = (SESSION.global() && SESSION.global().safariBaitCooldown ? SESSION.global().safariBaitCooldown : baitCooldownLength);
    var releaseCooldown = (SESSION.global() && SESSION.global().safariReleaseCooldown ? SESSION.global().safariReleaseCooldown : releaseCooldownLength);
    var contestDuration = 300; //Contest lasts for 5 minutes
    var contestCount = 0;
    var contestCatchers = {};
    var preparationPhase = 0;
    var preparationThrows = {};
    var preparationFirst = null;
    var contestantsCount = {};
    var contestantsWild = [];
    var lastWild = 0;
    var itemCap = 999;
    var moneyCap = 9999999;
    var wildEvent = false;

    var dailyBoost;
    var scientistQuest;

    //Don't really care if this resets after an update.
    var lastBaiters = [];
    var lastBaitersAmount = 3; //Amount of people that need to bait before you can
    var lastBaitersDecay = 50; //Seconds before the first entry in lastBaiters is purged
    var lastBaitersDecayTime = 50;
    var successfulBaitCount = 50;

    var effectiveness = {
        "Normal": {
            "Rock": 0.5,
            "Ghost": 0,
            "Steel": 0.5
        },
        "Fighting": {
            "Normal": 2,
            "Flying": 0.5,
            "Poison": 0.5,
            "Rock": 2,
            "Bug": 0.5,
            "Ghost": 0,
            "Steel": 2,
            "Psychic": 0.5,
            "Ice": 2,
            "Dark": 2,
            "Fairy": 0.5
        },
        "Flying": {
            "Fighting": 2,
            "Rock": 0.5,
            "Bug": 2,
            "Steel": 0.5,
            "Grass": 2,
            "Electric": 0.5
        },
        "Poison": {
            "Poison": 0.5,
            "Ground": 0.5,
            "Rock": 0.5,
            "Ghost": 0.5,
            "Steel": 0,
            "Grass": 2,
            "Fairy": 2
        },
        "Ground": {
            "Flying": 0,
            "Poison": 2,
            "Rock": 2,
            "Bug": 0.5,
            "Steel": 2,
            "Fire": 2,
            "Grass": 0.5,
            "Electric": 2
        },
        "Rock": {
            "Fighting": 0.5,
            "Flying": 2,
            "Ground": 0.5,
            "Bug": 2,
            "Steel": 0.5,
            "Fire": 2,
            "Ice": 2
        },
        "Bug": {
            "Fighting": 0.5,
            "Flying": 0.5,
            "Poison": 0.5,
            "Ghost": 0.5,
            "Steel": 0.5,
            "Fire": 0.5,
            "Grass": 2,
            "Psychic": 2,
            "Dark": 2,
            "Fairy": 0.5
        },
        "Ghost": {
            "Normal": 0,
            "Ghost": 2,
            "Psychic": 2,
            "Dark": 0.5
        },
        "Steel": {
            "Rock": 2,
            "Steel": 0.5,
            "Fire": 0.5,
            "Water": 0.5,
            "Electric": 0.5,
            "Ice": 2,
            "Fairy": 2
        },
        "Fire": {
            "Rock": 0.5,
            "Bug": 2,
            "Steel": 2,
            "Fire": 0.5,
            "Water": 0.5,
            "Grass": 2,
            "Ice": 2,
            "Dragon": 0.5
        },
        "Water": {
            "Ground": 2,
            "Rock": 2,
            "Fire": 2,
            "Water": 0.5,
            "Grass": 0.5,
            "Dragon": 0.5
        },
        "Grass": {
            "Flying": 0.5,
            "Poison": 0.5,
            "Ground": 2,
            "Rock": 2,
            "Bug": 0.5,
            "Steel": 0.5,
            "Fire": 0.5,
            "Water": 2,
            "Grass": 0.5,
            "Dragon": 0.5
        },
        "Electric": {
            "Flying": 2,
            "Ground": 0,
            "Water": 2,
            "Grass": 0.5,
            "Electric": 0.5,
            "Dragon": 0.5
        },
        "Psychic": {
            "Fighting": 2,
            "Poison": 2,
            "Steel": 0.5,
            "Psychic": 0.5,
            "Dark": 0
        },
        "Ice": {
            "Flying": 2,
            "Ground": 2,
            "Steel": 0.5,
            "Fire": 0.5,
            "Water": 0.5,
            "Grass": 2,
            "Ice": 0.5,
            "Dragon": 2
        },
        "Dragon": {
            "Steel": 0.5,
            "Dragon": 2,
            "Fairy": 0
        },
        "Dark": {
            "Fighting": 0.5,
            "Ghost": 2,
            "Psychic": 2,
            "Dark": 0.5,
            "Fairy": 0.5
        },
        "Fairy": {
            "Fighting": 2,
            "Poison": 0.5,
            "Steel": 0.5,
            "Fire": 0.5,
            "Dragon": 2,
            "Dark": 2
        }
    };
    var immuneMultiplier = 0.15;
    /* Poke Info Functions */
    var pokeInfo = {};
    pokeInfo.species = function(poke) {
        return poke & ((1 << 16) - 1);
    };
    pokeInfo.forme = function(poke) {
        return poke >> 16;
    };
    pokeInfo.shiny = function(poke) {
        return typeof poke === "string";
    };
    pokeInfo.readableNum = function(poke) {
        var ret = [];
        ret += pokeInfo.species(poke);
        if (pokeInfo.forme(poke) > 0) {
            ret += "-";
            ret += pokeInfo.forme(poke);
        }
        return ret;
    };
    pokeInfo.icon = function(p, shinyBG) {
        //Unown Icon hack. Remove after client update
        var p2 = p;
        var pcheck = p2%65536;
        if (pcheck == 201) {
            var pshift = Math.floor((p-201)/65536);
            if (pshift >= 5 && pshift < 17) {
                p2 += 65536;
            } else if (pshift >= 17 && pshift <= 25) {
                p2 += (65536*2);
            } else if (pshift === 26) {
                p2 = 327881;
            } else if (pshift === 27) {
                p2 = 1179849;
            }
        }
        //End of unown hack
       return '<img src="icon:' + p2 + '" title="#' + pokeInfo.readableNum(p) + " " + poke(p) + (shinyBG && pokeInfo.shiny(p) ? '" style="background:yellow"' : '"') + '>';
    };
    pokeInfo.sprite = function(poke) {
        var ret = [];
        ret += "<img src='pokemon:num=";
        ret += pokeInfo.readableNum(poke);
        if (pokeInfo.shiny(poke)) {
            ret += "&shiny=true";
        }
        ret += "&gen=6'>";
        return ret;
    };
    pokeInfo.valid = function(poke) {
        return sys.pokemon(poke) !== "Missingno";
    };
    pokeInfo.calcForme = function(base, forme) {
        return parseInt(base,10) + parseInt(forme << 16, 10);
    };
    /* End Poke Info Functions */

    //Data on items
    var itemData = {
        //Balls
        safari: {name: "safari", fullName: "Safari Ball", type: "ball", icon: 309, price: 30, ballBonus: 1, cooldown: 6000, aliases:["safariball", "safari", "safari ball"], tradable: false},
        great: {name: "great", fullName: "Great Ball", type: "ball", icon: 306, price: 60, ballBonus: 1.5, cooldown: 9000, aliases:["greatball", "great", "great ball"], tradable: false},
        ultra: {name: "ultra", fullName: "Ultra Ball", type: "ball", icon: 307, price: 120, ballBonus: 2, cooldown: 12000, aliases:["ultraball", "ultra", "ultra ball"], tradable: false},
        master: {name: "master", fullName: "Master Ball", type: "ball", icon: 308, price: 0, ballBonus: 255, cooldown: 90000, aliases:["masterball", "master", "master ball"], tradable: true},

        myth: {name: "myth", fullName: "Myth Ball", type: "ball", icon: 329, price: 0, ballBonus: 1, bonusRate: 3, cooldown: 9000, aliases:["mythball", "myth", "myth ball"], tradable: true},
        heavy: {name: "heavy", fullName: "Heavy Ball", type: "ball", icon: 315, price: 0, ballBonus: 1, bonusRate: 0.5, maxBonus: 5, cooldown: 12000, aliases:["heavyball", "heavy", "heavy ball"], tradable: true},
        quick: {name: "quick", fullName: "Quick Ball", type: "ball", icon: 326, price: 0, ballBonus: 1, cooldown: 12000, aliases:["quickball", "quick", "quick ball"], tradable: true},
        luxury: {name: "luxury", fullName: "Luxury Ball", type: "ball", icon: 324, price: 0, ballBonus: 1.25, cooldown: 10000, aliases:["luxuryball", "luxury", "luxury ball"], tradable: true},
        premier: {name: "premier", fullName: "Premier Ball", type: "ball", icon: 318, price: 0, ballBonus: 1.5, bonusRate: 3, cooldown: 10000, aliases:["premierball", "premier", "premier ball"], tradable: false},
        spy: {name: "spy", fullName: "Spy Ball", type: "ball", icon: 328, price: 0, ballBonus: 1.25, bonusRate: 1.25, cooldown: 9000, aliases:["spyball", "spy", "spy ball"], tradable: true},
        clone: {name: "clone", fullName: "Clone Ball", type: "ball", icon: 327, price: 0, ballBonus: 1, bonusRate: 0.05, cooldown: 11000, aliases:["cloneball", "clone", "clone ball"], tradable: true},

        //Other Items
        //Seasonal change. Rock icon is 206
        rock: {name: "rock", fullName: "Snowball", type: "usable", icon: 334, price: 50, successRate: 0.65, bounceRate: 0.1, targetCD: 7000, bounceCD: 11000, throwCD: 15000,  aliases:["rock", "rocks", "snow", "snowball", "snowballs"], tradable: false},
        bait: {name: "bait", fullName: "Bait", type: "usable", icon: 8017, price: 129, successRate: 0.4, failCD: 15, successCD: 50, aliases:["bait"], tradable: false},
        gacha: {name: "gacha", fullName: "Gachapon Ticket", type: "usable", icon: 132, price: 189, cooldown: 9000, aliases:["gacha", "gachapon", "gachapon ticket", "gachaponticket"], tradable: false},
        rare: {name: "rare", fullName: "Rare Candy", type: "usable", icon: 117, price: 0, aliases:["rare", "rarecandy", "rare candy", "candy"], tradable: true},
        mega: {name: "mega", fullName: "Mega Stone", type: "usable", icon: 2001, price: 0, aliases:["mega", "mega stone", "megastone"], duration: 3, tradable: true},
        stick: {name: "stick", fullName: "Stick", type: "usable", icon: 164, price: 99999, cooldown: 30000, aliases:["stick","sticks"], tradable: false},
        itemfinder: {name: "itemfinder", fullName: "Itemfinder", type: "usable", icon: 69, price: 0, cooldown: 9000, charges: 30, aliases:["itemfinder", "finder", "item finder"], tradable: false},
        salt: {name: "salt", fullName: "Salt", type: "usable", icon: 127, price: 0, aliases: ["salt", "nacl"], tradable: false},

        silver: {name: "silver", fullName: "Silver Coin", type: "usable", icon: 273, price: 0, aliases: ["silver", "silver coin"], tradable: false},
        entry: {name: "entry", fullName: "Raffle Entry", type: "usable", icon: 333, price: 0, aliases: ["entry", "raffle", "raffleentry", "raffle entry"], tradable: false},

        //Consumables (for useItem)
        gem: {name: "gem", fullName: "Ampere Gem", type: "consumable", icon: 245, price: 0, cooldown: 0, charges: 20, aliases:["gem", "ampere", "ampere gem", "amperegem"], tradable: true},

        //Perks
        amulet: {name: "amulet", fullName: "Amulet Coin", type: "perk", icon: 42, price: 0, bonusRate: 0.03, maxRate: 0.3, aliases:["amulet", "amuletcoin", "amulet coin", "coin"], tradable: true, tradeReq: 10},
        honey: {name: "honey", fullName: "Honey", type: "perk", icon: 82, price: 0, bonusRate: 0.03, maxRate: 0.3, aliases:["honey"], tradable: true},
        soothe: {name: "soothe", fullName: "Soothe Bell", type: "perk", icon: 35, price: 0, bonusRate: 0.03, maxRate: 0.3, aliases:["soothe", "soothebell", "soothe bell", "bell"], tradable: true},
        crown: {name: "crown", fullName: "Relic Crown", type: "perk", icon: 278, price: 0, bonusRate: 0.01, maxRate: 0.1, aliases:["crown", "reliccrown", "relic crown", "relic"], tradable: true, tradeReq: 10},
        scarf: {name: "scarf", fullName: "Silk Scarf", type: "perk", icon: 31, price: 0, bonusRate: 0.015, maxRate: 0.15, aliases:["scarf", "silkscarf", "silk scarf", "silk"], tradable: true},
        battery: {name: "battery", fullName: "Cell Battery", type: "perk", icon: 241, price: 0, bonusRate: 2, maxRate: 20, aliases:["battery", "cellbattery", "cell battery", "cell"], tradable: true},
        eviolite: {name: "eviolite", fullName: "Eviolite", type: "perk", icon: 233, price: 0, bonusRate: 8, maxRate: 80, threshold: 420, aliases:["eviolite"], tradable: true},
        box: {name: "box", fullName: "Box", type: "perk", icon: 175, price: [0, 0, 0, 0, 100000, 200000, 400000, 600000, 800000, 1000000], bonusRate: 96, aliases:["box", "boxes"], tradable: false},

        //Valuables
        pearl: {name: "pearl", fullName: "Pearl", type: "valuables", icon: 111, price: 500, aliases:["pearl"], tradable: true},
        stardust: {name: "stardust", fullName: "Stardust", type: "valuables", icon: 135, price: 750, aliases:["stardust"], tradable: true},
        bigpearl: {name: "bigpearl", fullName: "Big Pearl", type: "valuables", icon: 46, price: 1500, aliases:["bigpearl", "big pearl"], tradable: true},
        starpiece: {name: "starpiece", fullName: "Star Piece", type: "valuables", icon: 134, price: 3000, aliases:["starpiece", "star piece"], tradable: true},
        nugget: {name: "nugget", fullName: "Nugget", type: "valuables", icon: 108, price: 4000, aliases:["nugget"], tradable: true},
        bignugget: {name: "bignugget", fullName: "Big Nugget", type: "valuables", icon: 269, price: 10000, aliases:["bignugget", "big nugget"], tradable: true}
    };
    //var defaultCostumePrice = 75000;
    var costumeData = {
        inver: {icon: 387, name: "inver", fullName: "Inver", aliases: ["inver", "inverse", "psychic"], effect: "Inverts Type Effectiveness while catching.", price: 120000},
        //ranger: {icon: 348, name: "ranger", fullName: "Poke Ranger", aliases: ["ranger", "pokeranger", "poke ranger", "pokemonranger", "pokemon ranger"], effect: "???"}, // TBD
        breeder: {icon: 379, name: "breeder", fullName: "Poke Breeder", aliases: ["breeder", "pokebreeder", "poke breeder", "pokemonbreeder", "pokemon breeder"], keepRate: 0.15, effect: "Has a small chance to require 1 less Rare Candy to evolve."},
        scientist: {icon: 431, name: "scientist", fullName: "Scientist", aliases: ["scientist"], bonusRate: 0.03, effect: "Provides a bonus to Clone Ball catch rate."},
        ace: {icon: 344, name: "ace", fullName: "Ace Trainer", aliases: ["ace", "ace trainer", "acetrainer"], bonusRate: 0.08, effect: "Slightly reduces cooldown after a successful catch.", price: 85000},
        tech: {icon: 370, name: "tech", fullName: "Technician", aliases: ["technician", "worker", "tech", "mechanic"], retryRate: 0.03, effect: "Reduces likelihood of acquiring a Safari Ball from Gachapon."}, //3% = turns ~25% chance into  ~22.75% chance (2.25% boost)
        aroma: {icon: 397, name: "aroma", fullName: "Aroma Lady", aliases: ["aroma", "aromalady", "aroma lady"], bonusRate: 0.05, effect: "Increases the odds that a  Bait will attract a wild Pokémon.", price: 50000},
        chef: {icon: 423, name: "chef", fullName: "Chef", aliases: ["chef", "cook"], keepRate: 0.45, effect: "Provides a chance to not consume Bait if no Pokémon is attracted.", price: 65000},
        explorer: {icon: 373, name: "explorer", fullName: "Explorer", aliases: ["explorer"], retryRate: 0.1, effect: "Increases the likelihood of finding an item with Itemfinder."}, //10% = turns 80% failure into 78.4% failure (1.6% boost)
        fisher: {icon: 359, name: "fisher", fullName: "Fisherman", aliases: ["fisher", "fisherman", "fisher man"], keepRate: 0.2, effect: "Provides a chance to recover a thrown ball that fails to catch a Pokémon.", price: 50000} //Bonus to not lose your ball that you throw on a failed catch
    };
    var base64icons = {
    itemfinder: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAYAAACpSkzOAAAALHRFWHRDcmVhdGlvbiBUaW1lAEZyaSAyMSBOb3YgMjAxNCAyMDozMDo0NCAtMDAwMKEIypIAAAAHdElNRQfeCxUUHwrCV61vAAAACXBIWXMAAAsSAAALEgHS3X78AAAABGdBTUEAALGPC/xhBQAABExJREFUeNqFVutPHFUU/93ZpWyAamOMgIm2Pgrl0ZVHq9t+EAPtZiHWRGOaSFPoF+tnYrJGv+jXEhL/Ah8gaRPb2KSNFqqtSiOQxnYXpFUxatwEAbWBpkuz7GOuc+7OnblzZ0hPcrMze8+5v/M7rzuMr/UDMHCwb5EXiyZIrl9uYUABuWwOkZoIpPjf8+g+mnHsps4/wyLVoUD9sAS5du1jGMw632CIxU7w2YkmFqkho5JQ5Jw7RvRMdgSi2h2w7TjPg1n/qU4ZscQvfGrqI0tvD+5m5sHMEmZmP8UL8QXe2b1gnViBzY2iMJSyubGJA72/BtrtP7zANzcKUIWYGfLlbuZz7HiyFeuZBVgu4YuTjRjuq8e+nnkee3lRAEpRPdXt9H0ZifC2ijBM08TDO9uw/lcaO3Y+h2KphKOf/I5SyUTY2n/skUfR0T3Ppy82ODkIsqN3nYkENaYuPs0O9byFQqGA7U9EUTI5urrexA9fNrDZid1iZe+toa6uDgePEDNDePn9had8dlfffxfcBtNzyqjqCDn+xt88Xygn/rtzu6xCqPB49tLrGV4omLhxZS/LZe85h7x45A9hl88XhTMrKyuYvmBVX802j31YxpSYOeh24rkW88HBQew7NMZ//KbVUjBtZs8y0o8lfuahUEjRNz32YTWmVE2V1ZWe97KRIcDn5uaE1/sP3+JSp2Tlk/Zqa2uRTCYxNDQUYA8vkAriemaIUm5qahUHxuNxdHR0OKxHR0fF79LSEtLptB0Jcsz0VJ+TI/VPl5kLsrq6KkKxtvYfOHedGR4eAYWMAIkd5Wh5eRk3r7aI8PpyFMSMmrmlJSqMJcjMpT1MTotyMbwjioEAx8fHnYIAQpBAdL6hAhATV8p5kQklY6pGFYQ8pSKiFkgm38bAwAAMw0B7e7voO5qF7ml2ddGSTOiZ2DQ373VCVlkZtvbdvtD7RDawdK4866qdfUMy0WeZKsRm5lKjwyZIn5gFsSIutB/2T2WKaZVQ1sX1VNePYCuR5xuqZ/n7NN5D4to4dWpEeFVfX2+DhnxMdWYquFPW9r6vjyg3IyMfIpVKiZKluLe1taGzZ47fuNLsTAT9vpEA6dRNWFmi68kjYVk9upEEEcZ2I6pM/DdvlQBv+udrvPb8Q0QFr6aYiEQue79cDHqM6WA1BHo4dH0CocY+dmwAVX3v4YPr1Th5fh3HB0+IcRWp2e7vIypTOphyQx7Somcq71zWmyNiQkLh7u8/LkYTRYFyKnNDg7iz5yfu6yMq03Nnz4ghSV1OiybC9FeNztWh95EqFHIq8d7eXkxOTjrRCOyjy2ceZ78t3sadO/+K9e3ZXYyG5IOqTTSmxYZYSQBP1QXd8cRMV96qjyjcdIUQSDQaxdjYmBisiURCgFLYWfm7zvVUvSoe/F2X89y0uxuaRSuobE+f/kyEXQCpt+pWot+8QaHreuVP53NAyuxEedr/DwgKwzi3jMhsAAAAAElFTkSuQmCC",
    gacha: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYBAMAAAASWSDLAAAAA3NCSVQICAjb4U/gAAAAG1BMVEX////4+Piw2OjgoNh4kKi4cMCISKhwSGAwMDAYBeQdAAAACXRSTlMA//////////83ApvUAAAACXBIWXMAAArwAAAK8AFCrDSYAAAAIHRFWHRTb2Z0d2FyZQBNYWNyb21lZGlhIEZpcmV3b3JrcyBNWLuRKiQAAAB0SURBVHicpYwxCoAwDEUzdhXxApncxRt4AZHGveLHWTyAiyXHtlWLHQX/9B68hOjHNGfeM35FwVwnnmRNopjFPZ3O1mK8RWHLVsBd6AwwFIVg4ySlwNUx8+ijLNe9F9tUcnPowreHyUypiTvkZfIZk8n4007iyyLPYqOktAAAAABJRU5ErkJggg==",
    myth: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjEwMPRyoQAAARhJREFUSEvNlT0OgzAMhTlGj8CYo3TsETp2ZOzI2JGRscfoyNiRsUdgzObqIb0qGOenqkAdLCCJ32eHOK5EpNrSNhVH4P8BcM6JZSVbm8yAotPzKJZxPgWKAuAcEw7Hx66es4tBTADF/asVWA6UgqwAC3HvxcMyEABikH0Bet+/2aJYFosMSn+s/skUt7ZpfwCiyJ0azoeR4/126VZHdpVBfR7mE0ERfNNiwhTHOl0TJiAUvZ8O4lsneBLOyBFxuDYLQDUigqa5fhwhTtNi4Td8rIo262AcprnA4KQz0BCswfq+f5QBmEUIgQiFMK4tJp7sB0gXjpYgxzCfEs82HF7HFNLPn67r8PrdrOGUdKzcmv/oybkoU/NvdoVkS0HgewQAAAAASUVORK5CYII=",
    box: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXZwQWcAAAAgAAAAIACH+pydAAAA5UlEQVRIx92VwQ2DMAxFMwLHHjtCRuHIGDly7AgdgREyAkdGYIxuEGQJV6ljOwZSVerhCxGF//wTYbsYo/um3M8B3vuEag4A09f6eOsMzGxOZYWJ5tPk0zz3rDld12DVyhEET3y3JGMBtWMBEMK4dEsc0nO884CaOVc5gkBorgJwA0g7c65ygFUBsBElwaRjCeF2DIDKP6SwvJDDCVDwIZcsDN0H+FICdp0AmiVY+o4FtEkA5rukBPRvLrqmmCAzlxKYW0UOKxIIdyA1PfMs0C5Z66jmwVEk2wGn2nXLKef+f+hf1QY4PRz+Bnq4AwAAAABJRU5ErkJggg==",
    entry: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAAAJcEhZcwAAD2AAAA9gAXp4RY0AAAJ4SURBVEhL7ZNdSFNhGMe96y7qou6jXSXM7Xy8mzbmsmIO23Duq02jSIlJC0zMjwKR1ILIzYQRCRUGEnoq6CJtQiCCYZQFod2sKKplQREFQRc7+/ec7c0RzsrwKvaD5+KMvf/zPM/7OyVF/h9MkjgmScIAf1w/zBQqCcJCst2D2Yjru1kwrM9LGBN9TBKRCO9Dpr8eOHMA6A3iXrMTJtHYw/+2NioEYTszGHYEqsoxENiDTF8IGIoAH1PI0t8A0G9KowMui6lVp9Nt4Ed/jyzLpUwUfW1O6+tOVyXUc43AzQvApQ5gYRZIPgGezQHnm4Cr3dkXjx6qhtvCjvOIwlgshi2yKPZQ6PRwgx2fuvdnO8TDBJBRgZlbwI1BINYMTCtANAxVieFRixvD9XvhqWRxHrUSzQqPzTQ5RTt+0eEFpq7luuyjfX/+QBMM0QTtQGKE1nQMaSWKpVN+dLmsCNt3KrJQ5meMbeRxeczmvBVvuvy0VwqcuAJ8+5rrWrvMeEtuEip18CjUswcRtJnhs5mey3JZablev5XH5clawciKMbLiIh3upVLT1PWD3PjazrXueXCGjElTnaQ7YaIRPGYljJEVHrLi9G5k3tHhRTcw76Qug8D7V8DcxLIdPyt5og7KYccX0nFRNuqreVRhmGQcn7nthKqFP6bgtm1A3SbgLV3oCO+W1/2IE9qdUPC4LBpbecSfcTnk+OT1GqiXGeDbDHipUjTBS9rxaIisqF22goLX/hFptx30mqJ3Y+T4nV10qVVI0wRLT33obLLiiL1idSv+Fu1wbY0c19aVToUQcJvhcbGsFfpCVvwrmv9Mlla3okiRXykp+QE8HqM/vT34MQAAAABJRU5ErkJggg=="
    };

    var gachaItems = {
        safari: 80, great: 50, ultra: 30, luxury: 35, myth: 20, quick: 7, heavy: 20, clone: 20,
        bait: 95, rock: 200, gem: 9,
        wild: 60, horde: 8,
        gacha: 1,  master: 1,
        amulet: 1, soothe: 1, scarf: 1, battery: 1,
        pearl: 15, stardust: 12, bigpearl: 9, starpiece: 5, nugget: 4, bignugget: 1
    };
    var finderItems = {
        crown: 1, honey: 1, eviolite: 1,
        rare: 3, recharge: 8, spy: 20, rock: 14, bait: 16, pearl: 8, stardust: 6, luxury: 12, gacha: 11,
        nothing: 400
    };

    //Master list of items
    var currentItems = Object.keys(itemData);
    var retiredItems = [];
    var allItems = currentItems.concat(retiredItems, "permfinder");
    var allBalls = ["safari", "great", "ultra", "master", "myth", "luxury", "quick", "heavy", "spy", "clone", "premier"]; //to-do make dynamic based on current balls. Maybe also reference this for line2 in bag?
    var allCostumes = Object.keys(costumeData);

    var playerTemplate = {
        id: "",
        idnum: 0,
        pokemon: [],
        party: [],
        money: 0,
        costume: "none",
        balls: {
            safari: 0,
            great: 0,
            ultra: 0,
            master: 0,
            myth: 0,
            heavy: 0,
            quick: 0,
            luxury: 0,
            bait: 0,
            rock: 0,
            stick: 0,
            premier: 0,
            spy: 0,
            clone: 0,
            gacha: 0,
            rare: 0,
            mega: 0,
            amulet: 0,
            honey: 0,
            eviolite: 0,
            soothe: 0,
            crown: 0,
            scarf: 0,
            battery: 0,
            itemfinder: 0,
            permfinder: 0,
            pearl: 0,
            stardust: 0,
            starpiece: 0,
            bigpearl: 0,
            nugget: 0,
            bignugget: 0,
            gem: 0,
            box: 4,
            salt: 0,
            entry: 0,
            silver: 0
        },
        records: {
            gachasUsed: 0,
            masterballsWon: 0,
            jackpotsWon: 0,
            capsulesLost: 0,
            itemsDiscarded: 0,
            contestsWon: 0,
            pokesCaught: 0,
            pokesNotCaught: 0,
            pokesReleased: 0,
            pokesCloned: 0,
            pokesEvolved: 0,
            pokeSoldEarnings: 0,
            luxuryEarnings: 0,
            pawnEarnings: 0,
            rocksThrown: 0,
            rocksHit: 0,
            rocksMissed: 0,
            rocksBounced: 0,
            rocksDodged: 0,
            rocksHitBy: 0,
            rocksWalletHit: 0,
            rocksWalletHitBy: 0,
            rocksCaught: 0,
            rocksDodgedWindow: 0,
            rocksMissedWindow: 0,
            rocksWalletEarned: 0,
            rocksWalletLost: 0,
            rocksWindowEarned: 0,
            rocksWindowLost: 0,
            baitUsed: 0,
            baitAttracted: 0,
            baitNothing: 0,
            itemsFound: 0,
            collectorEarnings: 0,
            collectorGiven: 0,
            scientistEarnings: 0,
            scientistGiven: 0,
            arenaWon: 0,
            arenaLost: 0,
            arenaPoints:0,
            consecutiveLogins: 0
        },
        costumes: {
            inver: 0,
            ranger: 0,
            breeder: 0,
            scientist: 0,
            ace: 0,
            tech: 0,
            aroma: 0,
            chef: 0,
            explorer: 0,
            fisher: 0
        },
        savedParties: [],
        megaTimers: [],
        starter: null,
        lastLogin: null,
        consecutiveLogins: 1,
        visible: true,
        flashme: false,
        altlog: [],
        tradeban: 0,
        trackers: [],
        cooldowns: {
            ball: 0,
            ballUse: 0,
            rock: 0,
            gacha: 0,
            itemfinder: 0,
            stick: 0,
            costume: 0,
            auction: 0
        },
        shop: {},
        quests: {
            collector: {
                requests: [],
                reward: 0,
                cooldown: 0,
                deadline: null
            },
            scientist: {
                cooldown: 0,
                pokemon: 0
            },
            arena: {
                cooldown: 0
            },
            wonder: {
                cooldown: 0
            }
        }
    };

    var currentTheme;
    var nextTheme;
    var currentRules;
    var nextRules;
    var defaultRules = {
        "onlyTypes": { //Picks one of the random sets and excludes all types not in that array
            "chance": 0,
            "sets": [
                ["Water", "Fire", "Grass"],
                ["Dark", "Fighting", "Psychic"]
            ]
        },
        "excludeTypes": { //onlyTypes has priority over excludeTypes; if a set from onlyTypes is used, excludeTypes will be skipped
            "Normal" : 0.05,
            "Fighting" : 0.05,
            "Flying" : 0.05,
            "Poison" : 0.05,
            "Ground" : 0.05,
            "Rock" : 0.05,
            "Bug" : 0.05,
            "Ghost" : 0.05,
            "Steel" : 0.05,
            "Fire" : 0.05,
            "Water" : 0.05,
            "Grass" : 0.05,
            "Electric" : 0.05,
            "Psychic" : 0.05,
            "Ice" : 0.05,
            "Dragon" : 0.05,
            "Dark" : 0.05,
            "Fairy" : 0.05
        },
        "bonusTypes": { //Excluded types have priority over bonus types. If a type is picked by both, it will only count for exclude.
            "Normal" : 0.05,
            "Fighting" : 0.05,
            "Flying" : 0.05,
            "Poison" : 0.05,
            "Ground" : 0.05,
            "Rock" : 0.05,
            "Bug" : 0.05,
            "Ghost" : 0.05,
            "Steel" : 0.05,
            "Fire" : 0.05,
            "Water" : 0.05,
            "Grass" : 0.05,
            "Electric" : 0.05,
            "Psychic" : 0.05,
            "Ice" : 0.05,
            "Dragon" : 0.05,
            "Dark" : 0.05,
            "Fairy" : 0.05
        },
        "excludeBalls": {
            "safari": 0,
            "great": 0.02,
            "ultra": 0.08,
            "master": 0.10,
            "myth": 0.125,
            "luxury": 0.125,
            "quick": 0.15,
            "heavy": 0.125,
            "spy": 0.125,
            "clone": 0.125,
            "premier": 0.125
        },
        "bst": { //Both min and max are optional. It's possible to have only one of them in this object
            "minChance": 0,
            "min": [230, 400],
            "maxChance": 0.11,
            "max": [430, 531]
        },
        "noLegendaries": {
            "chance": 0.07
        },
        "inver": {
            "chance": 0.12
        },
        "rewards": {
            "sets": {
                "defaultSet": {
                    "gacha": 10
                },
                "extra": {
                    "gacha": 15,
                    "silver": 2
                },
                "gem": {
                    "gacha": 10,
                    "gem": 1
                },
                "nugget": {
                    "gacha": 10,
                    "nugget": 1
                }
            },
            "chance": {
                "defaultSet": 0.85,
                "extra": 0.05,
                "gem": 0.05,
                "nugget": 0.05
            }
        }
    };
    /* Theme Syntax:
    forest: {
        types: ["Grass", "Bug"], //Types that will be included. Pokémon only needs to match one of these types
        excludeTypes: [], //Types that will be excluded even if it matches the type above
        include: [16, 17, 18, 25, 163, 164], //Pokémon that do not match any of the criteria above, but will be included anyway
        exclude: [492, 649], //Pokémon that matches all of the previous criteria, but will be excluded anyway,
        customBST: { "289": 600 }, //Makes a pokémon count as a different BST for this theme. In the example, Pokémon #289 (Slaking) will be considered a 600 BST Pokémon for this theme.
        maxBST: 600, //Choose a different maximum BST for pokémon to spawn. Optional, defaults to 600.
        minBST: 300 //Choose a different minimum BST for pokémon to spawn. Optional, defaults to 300.
    }
    */
    var contestThemes = {
        "forest" : {
            "name":"Forest","types":["Grass","Bug"],"excludeTypes":[],"include":[16,17,18,25,163,164,438,185,452,65948,131484,65949,131485,172,287,288,289,26,251,65957,66122,66121,716],"exclude":[649,640,452,451,455,459,460,331,332,345,346,347,348,65948,131484,65949,131485,492,66028,556,557,558],"customBST":{"251":625,"289":600,"716":630},"minBST":300,"maxBST":631,"icon":716
        },
        "sea" : {
            "name":"Sea","types":["Water"],"excludeTypes":[],"include":[524954,721562,65958,65959,298,712,713,686,687,691,249,131738,618,604,603,602,147,148,347,345,346,348,490,66086],"exclude":[60,61,62,194,195,186,535,536,537,656,657,658,647,503,502,501,270,271,272,283,245,418,419,258,259,260,400,489,515,516,79,80,199,54,55,580,581,158,159,160],"customBST":{"249":640,"490":630},"minBST":300,"maxBST":641,"icon":249
        },
        "lake" : {
            "name":"Lake","types":["Water"],"excludeTypes":[],"include":[852634,656026,284,399,65958,65959,480,481,482,298,161,162,193,469,16,17,18,396,397,398,267,269,12,15,666,245,453,454,83],"exclude":[7,8,9,91,138,139,140,141,72,73,86,87,120,121,320,321,319,224,222,223,226,363,364,365,366,368,367,369,370,458,456,457,489,490,564,565,592,593,594,550,721,688,689,690,692,693,647,170,171,230,117,116,98,99,422,65958,423,65959,393,394,395],"customBST":{"245":625,"480":620,"481":620,"482":620},"minBST":300,"maxBST":626,"icon":245
        },
        "volcano" : {
            "name":"Volcano","types":["Fire","Rock"],"excludeTypes":["Water","Ice"],"include":[1049242,721,208,661,146,244,485],"exclude":[377,639,719,703,494],"customBST":{"146":634,"244":634,"485":637,"721":637},"minBST":315,"maxBST":641,"icon":485
        },
        "cave" : {
            "name":"Cave","types":["Rock","Ground","Dark"],"excludeTypes":["Flying"],"include":[41,42,169,92,93,202,360,29,30,32,33,206,535,718,719,147,148,35,36,236,296,297,307,308,66,67],"exclude":[185,197,219,220,221,222,318,319,332,342,359,369,389,423,473,434,435,438,449,450,452,461,509,510,551,552,553,559,560,564,565,570,571,624,625,658,660,675,686,687,215,622,623],"customBST":{"248":610,"442":550,"445":610,"718":640,"719":627},"minBST":300,"maxBST":641,"icon":718
        },
        "sky" : {
            "name":"Sky","types":["Flying"],"excludeTypes":["Bug"],"include":[329,330,635,351,641,642,645,717],"exclude":[146,145,144,226,458,130],"customBST":{"149":610,"373":610,"635":610,"641":620,"642":620,"645":620,"717":630},"minBST":300,"maxBST":631,"icon":717
        },
        "urban" : {
            "name":"Urban","types":["Poison","Dark","Steel"],"excludeTypes":["Grass","Water","Fairy"],"include":[52,53,209,210,300,301,479,66015,131551,197087,262623,328159,506,507,508,19,20,582,583,584,676,66212,131748,197284,262820,328356,393892,459428,524964,590500,358,707,25,66,67,68,64,63,65,56,57,494,720,143,204,425,426,446,447,616,532,534,533,131484,131485],"exclude":[],"customBST":{"66015":590,"131551":590,"197087":590,"262623":590,"328159":590,"590500":580,"524964":580,"459428":580,"393892":580,"328356":580,"262820":580,"197284":580,"131748":580,"66212":580,"494":625,"720":625,"376":610},"minBST":300,"maxBST":626,"icon":66015
        },
        "tundra" : {
            "name":"Tundra","types":["Ice"],"excludeTypes":[],"include":[86,90,216,217,234,393,394,395,197193,197194,66202,787098,1114778,144,378,646],"exclude":[],"customBST":{"144":625,"378":625,"646":635},"minBST":300,"maxBST":636,"icon":646
        },
        "factory" : {
            "name":"Factory","types":["Steel","Electric"],"excludeTypes":[],"include":[137,233,474,145,243,649],"exclude":[385,379,642,638,476,485,530,624,625,589,212],"customBST":{"145":622,"243":622,"376":610,"649":630},"minBST":300,"maxBST":631,"icon":145
        },
        "meadow" : {
            "name":"Meadow","types":["Normal","Fairy"],"excludeTypes":["Flying"],"include":[262810,66205,131741,197277,262813,66206,131742,197278,262814,328350,66207,131743,197279,262815,672,673,492,152,153,154,328346,590490,182,189,188,187,176,468,333,334,315,406,407,415,416,417,420,421,65957,285,286,548,549,43,45,44,69,70,71,66121,131657,197193,66122,131658,197194,587,666,12,15,414,193,283,284,469,470,311,312,25,26,648],"exclude":[719,137,351,474,233,694,695,303,676,703,707,132,122,439],"customBST":{"289":600,"492":617,"648":617,"328350":617},"minBST":300,"maxBST":621,"icon":492
        },
        "dojo" : {
            "name":"Dojo","types":["Fighting"],"excludeTypes":[],"include":[291,656,657,658,390,679,680,66217,624,625,681,143,638,639,640,647],"exclude":[],"customBST":{"66217":600,"647":610,"640":610,"639":610,"638":610},"minBST":300,"maxBST":611,"icon":107
        },
        "pyre" : {
            "name":"Mt. Pyre","types":["Ghost","Psychic"],"excludeTypes":["Normal","Steel","Fairy"],"include":[37,38,359,491,104,105,654,228,229,198,430,197,679,680,487],"exclude":[720,488,482,481,480,380,381,386,151,494,251,121],"customBST":{"487":640,"491":633},"minBST":300,"maxBST":641,"icon":487
        },
        "daycare" : {
            "name":"Daycare","types":["Normal","Fire","Water","Grass","Electric","Rock","Ground","Bug","Dark","Psychic","Steel","Ghost","Dragon","Fighting","Flying","Fairy","Ice","Poison"],"excludeTypes":[],"include":[66205,131741,197277,262813,65958,65948,131484,489],"exclude":[201,188,271,266,268,274,281,292,329],"customBST":{"58":320,"77":320,"111":320,"132":300,"138":320,"140":340,"215":340,"239":305,"240":305,"320":320,"345":340,"347":340,"366":320,"408":340,"410":340,"425":320,"427":320,"446":320,"489":340,"559":320,"564":340,"566":340,"619":320,"627":320,"629":320,"636":340,"682":320,"684":320,"696":340,"698":340},"minBST":240,"maxBST":341,"icon":132,
            "rules":{"bst":{"maxChance":1,"max":450},"onlyBalls":{"chance":1,"sets":[["safari","great","premier"]]},"rewards": {
            "sets":{"gacha":{"gacha":10},"rare":{"rare":1},"evio":{"eviolite":1}},"chance":{"gacha":0.85,"rare":0.12,"evio":0.03}}}
        },
        "tower" : {
            "name":"Dragonspiral Tower","types":["Dragon"],"excludeTypes":[],"include":[4,5,6,116,117,181,252,253,254,328,333,690,622,623,643,644],"exclude":[718,381,380],"customBST":{"643":630,"644":630},"minBST":300,"maxBST":631,"icon":644
        },
        "desert" : {
            "name":"Desert","types":["Rock","Ground"],"excludeTypes":["Water","Ice"],"include":[918170,331,332,556,455,23,24,379,508,227,65949,65948,694,695,377],"exclude":[],"customBST":{"248":610,"377":618,"379":618},"minBST":300,"maxBST":621,"icon":332
        },
        "starter" : {
            "name":"Starter Pokémon","types":[],"excludeTypes":[],"include":[1,2,3,4,5,6,7,8,9,25,133,152,153,154,155,156,157,158,159,160,252,253,254,255,256,257,258,259,260,387,388,389,390,391,392,393,394,395,495,496,497,498,499,500,501,502,503,650,651,652,653,654,655,656,657,658,250],"exclude":[],"customBST":{"3":610,"6":615,"9":610,"25":420,"133":480,"154":610,"157":610,"160":610,"196":535,"197":535,"250":640,"254":610,"257":625,"260":620,"389":610,"392":615,"395":610,"497":610,"500":615,"503":610,"652":615,"655":615,"658":625},"minBST":320,"maxBST":641,"icon":250
        },
        "cerulean" : {
            "name":"Cerulean Cave","types":[],"excludeTypes":[],"include":[24,26,28,42,44,47,49,64,70,75,82,85,97,132,129,60,118,80,117,119,40,101,105,111,112,113,150,57,67,202,55,79,54,130,74,61,53,359,296,433,436,151],"exclude":[],"customBST":{"151":675},"minBST":300,"maxBST":681,"icon":150
        },
        "ruins" : {
            "name":"Ruins","types":[],"excludeTypes":[],"include":[201,65737,131273,196809,262345,327881,393417,458953,524489,590025,655561,721097,786633,852169,917705,983241,1048777,1114313,1179849,1245385,1310921,1376457,1441993,1507529,1573065,1638601,1704137,1769673,202,360,353,354,355,356,235,436,437,92,93,94,524,525,526,343,344,177,178,679,680,442,561,562,563,138,139,140,141,142,622,623,605,606,696,299,476,200,429,359,566,567,486,345,346,483,484,697,698,699,410,408,409,411,564,565],"exclude":[],"customBST":{"442":550,"483":670,"484":670,"486":670},"minBST":300,"maxBST":671,"icon":486
        },
        "space" : {
            "name":"Space","types":[],"excludeTypes":[],"include":[386,385,374,375,376,35,36,120,121,173,577,578,579,605,606,337,338,622,623,132,351,517,518,488,524,525,526,197,371,372,373,81,82,462,299,476,704,705,706,425,426,206,599,600,601,545,586,628,608,626,611,516,594,547,558,575,343,344,358,433],"exclude":[],"customBST":{"132":350,"373":610,"376":610,"385":640,"386":640,"488":640},"minBST":300,"maxBST":641,"icon":385//"name":"Space","types":[],"excludeTypes":[],"include":[386,385,374,375,376,345,346,35,36,120,121,173,577,578,579,202,605,606,436,437,337,338,343,344,360,622,623,132,359,351,131423,65887,262495,517,518,488,177,178,442,599,600,601,524,525,526,561,197,43,44,45,371,372,373,81,82,462,299,476,621,704,705,706,703,425,426],"exclude":[],"customBST":{"132":350,"373":610,"376":610,"385":640,"386":640,"488":640},"minBST":300,"maxBST":641,"icon":385
        },
        "mega": {
            "name":"Mega Pokémon","types":[],"excludeTypes":[],"include":[1,2,3,4,5,6,7,8,9,13,14,15,16,17,18,63,64,65,79,80,92,93,94,95,115,123,127,129,130,142,179,180,181,199,208,212,214,228,229,246,247,248,252,253,254,255,256,257,258,259,260,280,281,282,302,303,304,305,306,307,308,309,310,318,319,322,323,333,334,353,354,359,361,362,371,372,373,374,375,376,380,381,384,427,428,443,444,445,447,448,459,460,475,531],"exclude":[],"customBST":{"380":670,"381":670},"minBST":320,"maxBST":681,"icon":65920
        },
        "weather": {
            "name":"Weather","types":[],"excludeTypes":[],"include":[351,65887,131423,262495,420,421,382,383,186,37,38,60,61,62,248,247,246,449,450,698,699,460,459,425,426,705,704,706,695,694,191,192,357,54,55,333,334,108,463,613,614,46,47,453,454,529,530,470,471,478,541,540,542,86,87,361,362,363,364,365,585,66121,197193,131657,586,66122,131658,197194,270,271,272,283,284,331,332,207,472,445,444,443,27,28,50,51,4,5,6,473,220,221,65957,422,65958,423,65959,1,2,3,315,406,407,582,583,584,69,70,71,131,128,83,78,277,310,338,337,580,581,628,627,629,630],"exclude":[],"customBST":{"65887":550,"131423":550,"262495":550,"65957":620,"383":640,"382":640,"706":610,"445":610},"minBST":300,"maxBST":641,"icon":351
        }
    };

    var wildForms = {
        "201": 27,
        "412": 2,
        "413": 2,
        "422": 1,
        "423": 1,
        "550": 1,
        "585": 3,
        "586": 3,
        "666": 17,
        "669": 4,
        "670": 4,
        "671": 4,
        "710": 3,
        "711": 3
    };
    var evolutions = {
        "1":{"evo":2,"candies":1},"2":{"evo":3},"4":{"evo":5,"candies":1},"5":{"evo":6},"7":{"evo":8,"candies":1},"8":{"evo":9},"10":{"evo":11,"candies":1},"11":{"evo":12},"13":{"evo":14,"candies":1},"14":{"evo":15},"16":{"evo":17,"candies":1},"17":{"evo":18},"19":{"evo":20},"21":{"evo":22},"23":{"evo":24},"25":{"evo":26},"27":{"evo":28},"29":{"evo":30,"candies":1},"30":{"evo":31},"32":{"evo":33,"candies":1},"33":{"evo":34},"35":{"evo":36},"37":{"evo":38},"39":{"evo":40},"41":{"evo":42,"candies":1},"42":{"evo":169},"43":{"evo":44,"candies":1},"44":{"evo":[45,182]},"46":{"evo":47},"48":{"evo":49},"50":{"evo":51},"52":{"evo":53},"54":{"evo":55},"56":{"evo":57},"58":{"evo":59},"60":{"evo":61,"candies":1},"61":{"evo":[62,186]},"63":{"evo":64,"candies":1},"64":{"evo":65},"66":{"evo":67,"candies":1},"67":{"evo":68},"69":{"evo":70,"candies":1},"70":{"evo":71},"72":{"evo":73},"74":{"evo":75,"candies":1},"75":{"evo":76},"77":{"evo":78},"79":{"evo":[80,199]},"81":{"evo":82,"candies":1},"82":{"evo":462},"84":{"evo":85},"86":{"evo":87},"88":{"evo":89},"90":{"evo":91},"92":{"evo":93,"candies":1},"93":{"evo":94},"95":{"evo":208},"96":{"evo":97},"98":{"evo":99},"100":{"evo":101},"102":{"evo":103},"104":{"evo":105},"108":{"evo":463},"109":{"evo":110},"111":{"evo":112,"candies":1},"112":{"evo":464},"113":{"evo":242},"114":{"evo":465},"116":{"evo":117,"candies":1},"117":{"evo":230},"118":{"evo":119},"120":{"evo":121},"123":{"evo":212},"125":{"evo":466},"126":{"evo":467},"129":{"evo":130},"133":{"evo":[470,471,135,134,136,196,197,700]},"137":{"evo":233,"candies":1},"138":{"evo":139},"140":{"evo":141},"147":{"evo":148,"candies":1},"148":{"evo":149},"152":{"evo":153,"candies":1},"153":{"evo":154},"155":{"evo":156,"candies":1},"156":{"evo":157},"158":{"evo":159,"candies":1},"159":{"evo":160},"161":{"evo":162},"163":{"evo":164},"165":{"evo":166},"167":{"evo":168},"170":{"evo":171},"172":{"evo":25,"candies":1},"173":{"evo":35,"candies":1},"174":{"evo":39,"candies":1},"175":{"evo":176,"candies":1},"176":{"evo":468},"177":{"evo":178},"179":{"evo":180,"candies":1},"180":{"evo":181},"183":{"evo":184},"187":{"evo":188,"candies":1},"188":{"evo":189},"190":{"evo":424},"191":{"evo":192},"193":{"evo":469},"194":{"evo":195},"198":{"evo":430},"200":{"evo":429},"204":{"evo":205},"207":{"evo":472},"209":{"evo":210},"215":{"evo":461},"216":{"evo":217},"218":{"evo":219},"220":{"evo":221,"candies":1},"221":{"evo":473},"223":{"evo":224},"228":{"evo":229},"231":{"evo":232},"233":{"evo":474},"236":{"evo":[107,106,237]},"238":{"evo":124},"239":{"evo":125,"candies":1},"240":{"evo":126,"candies":1},"246":{"evo":247,"candies":1},"247":{"evo":248},"252":{"evo":253,"candies":1},"253":{"evo":254},"255":{"evo":256,"candies":1},"256":{"evo":257},"258":{"evo":259,"candies":1},"259":{"evo":260},"261":{"evo":262},"263":{"evo":264},"265":{"evo":[266,268],"candies":1},"266":{"evo":267},"268":{"evo":269},"270":{"evo":271,"candies":1},"271":{"evo":272},"273":{"evo":274,"candies":1},"274":{"evo":275},"276":{"evo":277},"278":{"evo":279},"280":{"evo":281,"candies":1},"281":{"evo":[282,475]},"283":{"evo":284},"285":{"evo":286},"287":{"evo":288,"candies":1},"288":{"evo":289},"290":{"evo":[291,292]},"293":{"evo":294,"candies":1},"294":{"evo":295},"296":{"evo":297},"298":{"evo":183,"candies":1},"299":{"evo":476},"300":{"evo":301},"304":{"evo":305,"candies":1},"305":{"evo":306},"307":{"evo":308},"309":{"evo":310},"315":{"evo":407},"316":{"evo":317},"318":{"evo":319},"320":{"evo":321},"322":{"evo":323},"325":{"evo":326},"328":{"evo":329,"candies":1},"329":{"evo":330},"331":{"evo":332},"333":{"evo":334},"339":{"evo":340},"341":{"evo":342},"343":{"evo":344},"345":{"evo":346},"347":{"evo":348},"349":{"evo":[350]},"353":{"evo":354},"355":{"evo":356,"candies":1},"356":{"evo":477},"360":{"evo":202},"361":{"evo":[362,478]},"363":{"evo":364,"candies":1},"364":{"evo":365},"366":{"evo":[367,368]},"371":{"evo":372,"candies":1},"372":{"evo":373},"374":{"evo":375,"candies":1},"375":{"evo":376},"387":{"evo":388,"candies":1},"388":{"evo":389},"390":{"evo":391,"candies":1},"391":{"evo":392},"393":{"evo":394,"candies":1},"394":{"evo":395},"396":{"evo":397,"candies":1},"397":{"evo":398},"399":{"evo":400},"401":{"evo":402},"403":{"evo":404,"candies":1},"404":{"evo":405},"406":{"evo":315,"candies":1},"408":{"evo":409},"410":{"evo":411},"412":{"evo":[413,414]},"415":{"evo":416},"418":{"evo":419},"420":{"evo":421},"422":{"evo":423},"425":{"evo":426},"427":{"evo":428},"431":{"evo":432},"433":{"evo":358},"434":{"evo":435},"436":{"evo":437},"438":{"evo":185},"439":{"evo":122},"440":{"evo":113,"candies":1},"443":{"evo":444,"candies":1},"444":{"evo":445},"446":{"evo":143},"447":{"evo":448},"449":{"evo":450},"451":{"evo":452},"453":{"evo":454},"456":{"evo":457},"458":{"evo":226},"459":{"evo":460},"495":{"evo":496,"candies":1},"496":{"evo":497},"498":{"evo":499,"candies":1},"499":{"evo":500},"501":{"evo":502,"candies":1},"502":{"evo":503},"504":{"evo":505},"506":{"evo":507,"candies":1},"507":{"evo":508},"509":{"evo":510},"511":{"evo":512},"513":{"evo":514},"515":{"evo":516},"517":{"evo":518},"519":{"evo":520,"candies":1},"520":{"evo":521},"522":{"evo":523},"524":{"evo":525,"candies":1},"525":{"evo":526},"527":{"evo":528},"529":{"evo":530},"532":{"evo":533,"candies":1},"533":{"evo":534},"535":{"evo":536,"candies":1},"536":{"evo":537},"540":{"evo":541,"candies":1},"541":{"evo":542},"543":{"evo":544,"candies":1},"544":{"evo":545},"546":{"evo":547},"548":{"evo":549},"551":{"evo":552,"candies":1},"552":{"evo":553},"554":{"evo":555},"557":{"evo":558},"559":{"evo":560},"562":{"evo":563},"564":{"evo":565},"566":{"evo":567},"568":{"evo":569},"570":{"evo":571},"572":{"evo":573},"574":{"evo":575,"candies":1},"575":{"evo":576},"577":{"evo":578,"candies":1},"578":{"evo":579},"580":{"evo":581},"582":{"evo":583,"candies":1},"583":{"evo":584},"585":{"evo":586},"588":{"evo":589},"590":{"evo":591},"592":{"evo":593},"595":{"evo":596},"597":{"evo":598},"599":{"evo":600,"candies":1},"600":{"evo":601},"602":{"evo":603,"candies":1},"603":{"evo":604},"605":{"evo":606},"607":{"evo":608,"candies":1},"608":{"evo":609},"610":{"evo":611,"candies":1},"611":{"evo":612},"613":{"evo":614},"616":{"evo":617},"619":{"evo":620},"622":{"evo":623},"624":{"evo":625},"627":{"evo":628},"629":{"evo":630},"633":{"evo":634,"candies":1},"634":{"evo":635},"636":{"evo":637},"650":{"evo":651,"candies":1},"651":{"evo":652},"653":{"evo":654,"candies":1},"654":{"evo":655},"656":{"evo":657,"candies":1},"657":{"evo":658},"659":{"evo":660},"661":{"evo":662,"candies":1},"662":{"evo":663},"664":{"evo":665,"candies":1},"665":{"evo":666},"667":{"evo":668},"669":{"evo":670,"candies":1},"670":{"evo":671},"672":{"evo":673},"674":{"evo":675},"677":{"evo":678},"679":{"evo":680,"candies":1},"680":{"evo":681},"682":{"evo":683},"684":{"evo":685},"686":{"evo":687},"688":{"evo":689},"690":{"evo":691},"692":{"evo":693},"694":{"evo":695},"696":{"evo":697},"698":{"evo":699},"704":{"evo":705,"candies":1},"705":{"evo":706},"708":{"evo":709},"710":{"evo":711},"712":{"evo":713},"714":{"evo":715}
    };
    var megaEvolutions = {
        "3":[65539],"6":[65542, 131078],"9":[65545],"15":[65551],"18":[65554],"65":[65601],"80":[65616],"94":[65630],"115":[65651],"127":[65663],"130":[65666],"142":[65678],"150":[65686, 131222],"181":[65717],"208":[65744],"212":[65748],"214":[65750],"229":[65765],"248":[65784],"254":[65790],"257":[65793],"260":[65796],"282":[65818],"302":[65838],"303":[65839],"306":[65842],"308":[65844],"310":[65846],"319":[65855],"323":[65859],"334":[65870],"354":[65890],"359":[65895],"362":[65898],"373":[65909],"376":[65912],"380":[65916],"381":[65917],"382":[65918],"383":[65919],"384":[65920],"428":[65964],"445":[65981],"448":[65984],"460":[65996],"475":[66011],"531":[66067],"719":[66255]
    };
    var megaPokemon = [65539,65542,131078,65545,65551,65554,65601,65616,65630,65651,65663,65666,65678,65686,131222,65717,65744,65748,65750,65765,65784,65790,65793,65796,65818,65838,65839,65842,65844,65846,65855,65859,65870,65890,65895,65898,65909,65912,65916,65917,65918,65919,65920,65964,65981,65984,65996,66011,66067,66255];
    var legendaries = [144,145,146,150,151,243,244,245,249,250,251,377,378,379,380,381,382,383,384,385,386,480,481,482,483,484,485,486,487,488,489,490,491,492,493,494,638,639,640,641,642,643,644,645,646,647,648,649,716,717,718,719,720,721];

    //Adding a variable that already exists on player.records here will automatically make it available as a leaderboard
    //To add stuff not on player.records, you must add an exception on this.updateLeaderboards()
    var leaderboardTypes = {
        totalPokes: { desc: "by Pokémon owned", alts: [], alias: "owned" },
        pokesCaught: { desc: "by successful catches", alts: ["caught"], alias: "caught" },
        bst: { desc: "by total BST of Pokémon owned", alts: [], alias: "bst" },
        contestsWon: { desc: "by contests won", alts: ["contest", "contests"], alias: "contest" },
        money: { desc: "by money", alts: ["$"], alias: "money", isMoney: true },
        pokeSoldEarnings: { desc: "by money gained with selling Pokémon", alts: ["sold", "sell"], alias: "sold", isMoney: true },
        luxuryEarnings: { desc: "by money gained with Luxury Balls", alts: ["luxury", "luxuryball", "luxury ball"], alias: "luxury", isMoney: true },
        consecutiveLogins: { desc: "by longest streak of consecutive days login", alts: ["login", "logins"], alias: "login" },
        pokesCloned: { desc: "by successful clones", alts: ["clone", "clones", "cloned", "clone ball"], alias: "cloned" },
        gachasUsed: { desc: "by tickets used for Gachapon", alts: ["gacha"], alias: "gacha" },
        itemsFound: { desc: "by items found with Itemfinder", alts: ["found", "itemsfound", "items found"], alias: "found" },
        collectorEarnings: { desc: "by money received from the Collector", alts: ["collector money", "collectormoney", "collector $"], alias: "collector money", isMoney: true },
        collectorGiven: { desc: "by Pokémon given to the Collector", alts: ["collector", "collector pokémon", "collectorpokémon", "collector pokemon", "collector poke", "collectorpoke"], alias: "collector" },
        salt: { desc: "by saltiest players", alts: ["salt", "salty"], alias: "salt" }
    };

    function getAvatar(src) {
        if (SESSION.users(src)) {
            return SESSION.users(src).safari;
        }
    }
    function getAvatarOff(name) {
        var id = sys.id(name);
        var player;
        if (id) {
            player = getAvatar(id);
        }
        if (!player) {
            player = rawPlayers.get(name.toLowerCase());
            if (player) {
                player = JSON.parse(player);
            }
        }
        return player;
    }
    function now() {
        return new Date().getTime();
    }
    function timeLeft(time) {
        return Math.floor((time - now())/1000) + 1;
    }
    function timeLeftString(time) {
        return utilities.getTimeString(timeLeft(time));
    }
    function getDay(time) {
        return Math.floor(time / (1000 * 60 * 60 * 24));
    }
    function cap(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    function readable(arr, last_delim) {
        if (!Array.isArray(arr))
            return arr;
        if (arr.length > 1) {
            return arr.slice(0, arr.length - 1).join(", ") + " " + last_delim + " " + arr.slice(-1)[0];
        } else if (arr.length == 1) {
            return arr[0];
        } else {
            return "";
        }
    }
    function add(arr) {
        var result = 0;
        for (var e in arr) {
            result += arr[e];
        }
        return result;
    }
    function countRepeated(arr, val) {
        var count = 0;
        arr.forEach(function(x) {
            count += x === val ? 1 : 0;
        });
        return count;
    }
    /*function modeArray(arr) {
        var mode = {};
        var max = 0, count = 0;

        arr.forEach(function(e) {
            if (mode[e]) {
                mode[e]++;
            } else {
                mode[e] = 1;
            }

            if (count<mode[e]) {
                max = e;
                count = mode[e];
            }
        });

        return max;
    }*/
    /*function fillArray(item, amount) {
        var ret = [];
        for (var i = 0; i < amount; i++) {
            ret.push(item);
        }
        return ret;
    }*/
    function countArray(arr, item) {
        var first = arr.indexOf(item);
        var last = arr.lastIndexOf(item);
        var count =  last - first + (first === -1 ? 0 : 1);
        return count;
    }
    //Shamelessly stolen from http://stackoverflow.com/questions/23291256/ext-form-field-number-formatting-the-value
    function getOrdinal(n) {
        var s=["th","st","nd","rd"],
        v=n%100;
        return n+(s[(v-20)%10]||s[v]||s[0]);
    }
    function chance(value) {
        return Math.random() < value;
    }
    function randomSample(hash) {
        var cum = 0;
        var val = Math.random();
        var psum = 0.0;
        var x;
        var count = 0;
        for (x in hash) {
            psum += hash[x];
            count += 1;
        }
        if (psum === 0.0) {
            var j = 0;
            for (x in hash) {
                cum = (++j) / count;
                if (cum >= val) {
                    return x;
                }
            }
        } else {
            for (x in hash) {
                cum += hash[x] / psum;
                if (cum >= val) {
                    return x;
                }
            }
        }
    }
    function getRange(input) {
        var range = input.split("-"), lower, upper;
        
        if (range.length > 1) {
            lower = parseInt(range[0], 10);
            upper = parseInt(range[1], 10);
        } else {
            lower = 0;
            upper = parseInt(range[0], 10);
        }
        
        if (isNaN(lower) || isNaN(upper)) {
            return null;
        }
        if (lower === 0) {
            lower = 1;
        }
        return { lower: lower, upper: upper};
    }
    function getArrayRange(arr, lower, upper) {
        var result = arr.concat();

        if (lower >= 0) {
            return result.slice(Math.max(lower-1, 0), upper);
        } else {
            return result.slice(-upper, -lower);
        }
    }
    function addComma(num) {
        if (typeof num !== "number") {
            return num;
        }
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    /*
        Use this function for every time you need information about a Pokémon typed by a player (don't use for pokémon picked from player.pokemon).
        Returns an object with the following properties:
        -num: Int; Pokémon's number; Same that you would get with sys.pokeNum()
        -id: Int or String; Pokémon's id that can be added to player.pokemon
        -shiny: Boolean; If the pokémon is shiny or not
        -name: String; Pokémon's name (including Shiny prefix). Same as poke()
        -input: String; What you need to type to get to that result. Used for trade
    */
    function getInputPokemon(info) {
        var shiny = false, id, num, name;
        info = info.toLowerCase();

        if ((info.length > 1 && (info[0] == "*" || info[info.length-1] == "*")) || info.indexOf("shiny ") === 0) {
            shiny = true;
            info = info.replace("*", "");
            info = info.replace("shiny ", "");
        }
        num = parseInt(info, 10);
        if (isNaN(num)) {
            num = sys.pokeNum(info);
        }
        id = shiny ? num + "" : num;

        name = sys.pokemon(num);
        if (name == "Missingno") {
            num = null;
        }

        return { num: num, id: id, shiny: shiny, name: poke(id), input: (shiny ? "*" : "") + name };
    }
    function getPokemonInfo(info) {
        var shiny = false, id = info;

        if (typeof info == "string") {
            shiny = true;
            id = parseInt(info, 10);
            if (isNaN(id)) {
                id = null;
            }
        }

        return [id, shiny];
    }
    function poke(num) {
        var shiny = false;
        if (typeof num === "string") {
            num = parseInt(num, 10);
            shiny = true;
        }

        if (isNaN(num)) {
            return null;
        }
        var name = sys.pokemon(num);

        return name ? (shiny ? "Shiny " : "") + name : null;
    }
    function hasType(pokeNum, type) {
        return sys.type(sys.pokeType1(pokeNum)) == type || sys.type(sys.pokeType2(pokeNum)) == type;
    }
    function getBST(pokeNum) {
        return add(sys.pokeBaseStats(pokeNum));
    }
    function getPrice(pokeNum, shiny, perkBonus) {
        return Math.round(getBST(pokeNum) * (shiny ? 5 : 1) * (isLegendary(pokeNum) ? 10 : 1) * (perkBonus ? perkBonus : 1));
    }
    function itemAlias(name, returnGarbage, full) {
        name = name.toLowerCase();
        for (var e in itemData) {
            if (itemData[e].aliases.indexOf(name) !== -1) {
                if (full) {
                    return itemData[e].fullName;
                } else {
                    return itemData[e].name;
                }
            }
        }
        if (returnGarbage) {
            if (name === "wild") {
                return "Wild Pokémon";
            } else if (name === "horde") {
                return "Horde of Wild Pokémon";
            } else if (name === "nothing") {
                return "No item";
            } else if (name === "recharge") {
                return "Recharge";
            } else if (name === "permfinder") {
                return itemData.itemfinder.fullName + " Bonus";
            } else if (name === "valuables") {
                return "Valuables";
            }
            return name;
        } else {
            return "safari";
        }
    }
    function finishName(name) {
        return itemAlias(name, true, true);
    }
    function costumeAlias(name, returnGarbage, full) {
        for (var e in costumeData) {
            if (costumeData[e].aliases.indexOf(name) !== -1) {
                if (full) {
                    return costumeData[e].fullName;
                } else {
                    return costumeData[e].name;
                }
            }
        }
        if (returnGarbage || name === "none") {
            return name;
        } else {
            return "error";
        }
    }
    function costumeSprite(id, android) {
        if (isNaN(id)) {
            id = costumeIndex(costumeAlias(id));
        }
        if (android) {
            return "<img src='trainer:" + id + "'>";
        } else {
            return "<img src='Themes/Classic/Trainer Sprites/" + id + ".png'>";
        }
    }
    function costumeIndex(name) {
        if (costumeData.hasOwnProperty(name)) {
            return costumeData[name].icon;
        }
        return 1;
    }
    function themeName(obj) {
        if (Array.isArray(obj)) {
            return readable(obj.map(function(x){
                if (x === "none") {
                    return "Default";
                } else {
                    return contestThemes[x].name;
                }
            }), "or");
        }
        if (obj in contestThemes) {
            return contestThemes[obj].name;
        }
        return "Default";
    }
    function loadLastId () {
        try {
            return parseInt(permObj.get("lastIdAssigned"), 10);
        } catch (err) {
            return 0;
        }
    }
    function validPlayers (scope, src, tar, selfmsg) {
        var self = (scope === "self" || scope === "both");
        if (self) {
            var player = getAvatar(src);
            if (!player) {
                safaribot.sendMessage(src, "You need to enter the game first! Type /start for that.", safchan);
                return false;
            }
        }

        var other = (scope === "target" || scope === "both");
        if (other) {
            var targetId = sys.id(tar);
            if (!targetId || !sys.isInChannel(targetId, safchan)) {
                safaribot.sendMessage(src, "No such person!", safchan);
                return false;
            }
            if ((targetId == src || sys.ip(targetId) === sys.ip(src)) && selfmsg) {
                safaribot.sendMessage(src, selfmsg, safchan);
                return false;
            }
            var target = getAvatar(targetId);
            if (!target) {
                safaribot.sendMessage(src, "This person doesn't have a Safari Save!", safchan);
                return false;
            }
        }
        return true;
    }

    function isBall(item) {
        return item in itemData && itemData[item].type === "ball";
    }
    function bagRow (player, arr, isAndroid, textOnly, first) {
        var ret = [], item, item2;
        if (textOnly) {
            if (first) {
                ret += "<br /><b>Inventory</b><br />";
                ret += "Money: $" + addComma(player.money) + " | ";
            } else {
                ret += "<br />";
            }
            for (var i = 0; i < arr.length; i++) {
                item = itemData[arr[i]];
                if (item.name === "itemfinder") {
                    item2 = player.balls.itemfinder + player.balls.permfinder;
                } else {
                    item2 = player.balls[arr[i]];
                }
                ret += item.fullName + ": " + item2;
                if (i + 1 < arr.length) {
                    ret += " | ";
                }
            }
        } else {
            if (isAndroid) {
                var linebreak = 6;
                if (first) {
                    ret += "<br /><b>Inventory</b><br />";
                    ret += "<img src='item:274'>: $" + addComma(player.money);
                    linebreak--;
                }
                for (var i = 0; i < arr.length; i++) {
                    item = itemData[arr[i]];
                    if (item.name === "itemfinder") {
                        item2 = player.balls.itemfinder + player.balls.permfinder;
                    } else {
                        item2 = player.balls[arr[i]];
                    }
                    ret += " | <img src='";
                    var foundIcon = false;
                    for (var e in base64icons) {
                        if (e === item.name) {
                            ret += base64icons[e];
                            foundIcon = true;
                        }
                    }
                    if (!foundIcon) {
                        ret += "item:" + item.icon;
                    }
                    ret += "'>: " + item2;
                    linebreak--;
                    if (linebreak === 0 || (i + 1 == arr.length)) {
                        ret += "<br />";
                    }
                }
            } else {
                if (first) {
                    ret += "<table border = 1 cellpadding = 3><tr><th colspan=13>Inventory</th></tr><tr>";
                    ret += "<td valign=middle align=center colspan=2><img src='item:274' title='Money'></td>";
                } else {
                    ret += "<tr>";
                }
                for (var i = 0; i < arr.length; i++) {
                    item = itemData[arr[i]];
                    ret += "<td align=center><img src='";
                    var foundIcon = false;
                    for (var e in base64icons) {
                        if (e === item.name) {
                            ret += base64icons[e];
                            foundIcon = true;
                        }
                    }
                    if (!foundIcon) {
                        ret += "item:" + item.icon;
                    }

                    ret += "' title='" + item.fullName + "'></td>";
                }
                ret += "</tr><tr>";
                if (first) {
                    ret += "<td align=center colspan=2>$" + addComma(player.money) + "</td>";
                }
                for (var i = 0; i < arr.length; i++) {
                    if (arr[i] === "itemfinder") {
                        item = player.balls.itemfinder + player.balls.permfinder;
                    } else {
                        item = player.balls[arr[i]];
                    }
                    ret += "<td align=center>" + item + "</td>";
                }
                ret += "</tr>";
            }
        }
        return ret;
    }
    function isMega(num) {
        return megaPokemon.indexOf(num) !== -1;
    }
    function isLegendary(num) {
        return legendaries.indexOf(pokeInfo.species(num)) !== -1;
    }
    function toUsableBall(player, ball) {
        var picked, ballOrder = ["safari", "great", "ultra", "quick", "spy", "luxury", "heavy", "premier", "clone", "myth", "master"];

        var startFrom = 0;
        if (ball == ballOrder[0]) {
            startFrom = 1;
        }
        if (player.balls[ball] <= 0) {
            for (var e = startFrom; e < ballOrder.length; e++) {
                picked = ballOrder[e];
                if (player.balls[picked] > 0) {
                    return picked;
                }
            }
        } else {
            return ball;
        }
        return null;
    }
    function canLosePokemon(src, data, verb) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        if (contestCount > 0) {
            safaribot.sendMessage(src, "You can't " + verb + " a Pokémon during a contest!", safchan);
            return false;
        }
        if (player.pokemon.length == 1) {
            safaribot.sendMessage(src, "You can't " + verb + " your last Pokémon!", safchan);
            return false;
        }
        if (safari.isBattling(sys.name(src))) {
            safaribot.sendMessage(src, "You can't " + verb + " a Pokémon during a battle!", safchan);
            return;
        }
        var input = data.split(":");
        var info = getInputPokemon(input[0].replace(/flabebe/gi, "flabébé"));
        var id = info.id;
        if (!info.num) {
            safaribot.sendMessage(src, "Invalid Pokémon!", safchan);
            return false;
        }
        if (player.pokemon.indexOf(id) == -1) {
            safaribot.sendMessage(src, "You do not have that Pokémon!", safchan);
            return false;
        }
        var count = countRepeated(player.pokemon, id);
        if (player.party.length == 1 && player.party[0] === id && count <= 1) {
            safaribot.sendMessage(src, "You can't " + verb + " the only Pokémon in your party!", safchan);
            return false;
        }
        if (player.starter === id && count <= 1) {
            safaribot.sendMessage(src, "You can't " + verb + " your starter Pokémon!", safchan);
            return false;
        }
        if (info.input in player.shop && player.shop[info.input].limit >= count) {
            safaribot.sendMessage(src, "You need to remove this Pokémon from your shop before you can " + verb + " them!", safchan);
            return false;
        }
        if (pokeInfo.forme(info.num) > 0 && isMega(info.num)) {
            safaribot.sendMessage(src, "You can't " + verb + " a Pokémon while they are Mega Evolved!", safchan);
            return false;
        }
        return true;
    }
    function rewardCapCheck(src, reward, amount) {
        var cap = itemCap;
        var player = getAvatar(src);
        if (player.balls[reward] + amount > cap) {
            var check = cap - player.balls[reward];
            if (check < 1) {
                safaribot.sendMessage(src, "However, you didn't have any space left and were forced to discard " + (amount === 1 ? "it" : "them") + "!", safchan);
            } else {
                safaribot.sendMessage(src, "However, you only had space for " + check + " and were forced to discard the rest!", safchan);
            }
            player.records.itemsDiscarded += (amount - check);
            amount = check;
            if (amount < 0) {
                amount = 0;
            }
        }
        player.balls[reward] += amount;
    }
    function ballMacro(src) {
        var player = getAvatar(src);
        if (!player || sys.os(src) === "android") {
            return;
        }
        var ret = "", hasBalls = false;
        for (var i = 0; i < allBalls.length; i++) {
            var e = allBalls[i];
            if (player.balls[e] > 0 && (!currentRules || !currentRules.excludeBalls || !currentRules.excludeBalls.contains(e))) {
                ret += "«<a href='po:send//catch " + itemData[e].name +"'>" + cap(itemData[e].name) + "</a>» ";
                hasBalls = true;
            }
        }
        if (hasBalls) {
            safaribot.sendHtmlMessage(src, "Throw: " + ret, safchan);
        }
    }

    this.startContest = function(commandData) {
        contestCooldown = contestCooldownLength;
        contestCount = contestDuration;

        if (commandData.toLowerCase() === "none") {
            currentTheme = null;
            currentRules = this.pickRules(currentTheme);
        } else if (commandData.toLowerCase() in contestThemes) {
            currentTheme = commandData.toLowerCase();
            currentRules = this.pickRules(currentTheme);
        } else if (nextTheme) {
            if (Array.isArray(nextTheme)) {
                nextTheme = nextTheme[sys.rand(0, nextTheme.length)];
            }
            currentTheme = nextTheme == "none" ? null : nextTheme;
            if (nextRules && nextTheme in nextRules) {
                currentRules = nextRules[nextTheme];
            }
            nextTheme = null;
        } else {
            var themeList = Object.keys(contestThemes);
            currentTheme = Math.random() < 0.4 ? null : themeList[sys.rand(0, themeList.length)];
            currentRules = this.pickRules(currentTheme);
        }

        var icon = currentTheme && contestThemes[currentTheme].icon ? pokeInfo.icon(contestThemes[currentTheme].icon) + " " : "";
        if (icon) {
            sys.sendHtmlAll("<font color='magenta'><timestamp/> *** **********************************************************</font> " + icon, safchan);
        } else {
            sys.sendAll("*** ************************************************************ ***", safchan);
        }
        safaribot.sendHtmlAll("A new " + (currentTheme ? contestThemes[currentTheme].name + "-themed" : "") + " Safari contest is starting now!", safchan);
        if (currentRules && Object.keys(currentRules).length > 0) {
            safaribot.sendHtmlAll("Rules: " + this.translateRules(currentRules), safchan);
        }
        sys.sendAll("*** ************************************************************ ***", safchan);

        if (contestBroadcast) {
            sys.sendAll("*** ************************************************************ ***", 0);
            safaribot.sendAll("A new " + (currentTheme ? contestThemes[currentTheme].name + "-themed" : "") + " Safari contest is starting now at #" + defaultChannel + "!", 0);
            sys.sendAll("*** ************************************************************ ***", 0);
        } else {
            contestBroadcast = true;
        }
        this.flashPlayers();

        contestantsCount = {};
        contestantsWild = [];
        wildEvent = false;
        nextRules = null;
        safari.createWild();
    };
    this.pickRules = function(theme) {
        var out = {}, e, list, exclude;
        var rules = theme in contestThemes ? contestThemes[theme].rules : null;

        if (!rules) {
            if (sys.rand(0, 100) < 25) {
                return {};
            }
            rules = defaultRules;
        }

        if ("onlyTypes" in rules && chance(rules.onlyTypes.chance)) {
            list = rules.onlyTypes.sets.random();
            exclude = [];
            for (e in effectiveness) {
                if (!list.contains(e)) {
                    exclude.push(e);
                }
            }
            out.excludeTypes = exclude;
        } else if ("excludeTypes" in rules) {
            exclude = [];
            for (e in rules.excludeTypes) {
                if (chance(rules.excludeTypes[e])) {
                    exclude.push(e);
                    if (exclude.length >= 3) {
                        break;
                    }
                }
            }
            out.excludeTypes = exclude;
        }
        if ("bonusTypes" in rules) {
            list = [];
            for (e in rules.bonusTypes) {
                if ((!out.excludeTypes || !out.excludeTypes.contains(e) ) && chance(rules.bonusTypes[e])) {
                    list.push(e);
                    if (list.length >= 2) {
                        break;
                    }
                }
            }
            out.bonusTypes = list;
        }
        if ("onlyBalls" in rules && chance(rules.onlyBalls.chance)) {
            list = rules.onlyBalls.sets.random();
            exclude = [];
            for (e = 0; e < allBalls.length; e++) {
                if (!list.contains(allBalls[e])) {
                    exclude.push(allBalls[e]);
                }
            }
            out.excludeBalls = exclude;
        } else if ("excludeBalls" in rules) {
            exclude = [];
            for (e in rules.excludeBalls) {
                if (chance(rules.excludeBalls[e])) {
                    exclude.push(e);
                }
            }
            out.excludeBalls = exclude;
        }
        if ("bst" in rules) {
            var bst = rules.bst;
            if ("min" in bst && "minChance" in bst && chance(bst.minChance)) {
                if (typeof bst.min === "number") {
                    out.minBST = bst.min;
                } else {
                    out.minBST = sys.rand(bst.min[0], bst.min[1]);
                }
            }
            if ("max" in bst && "maxChance" in bst && chance(bst.maxChance)) {
                if (typeof bst.max === "number") {
                    out.maxBST = bst.max;
                } else {
                    out.maxBST = sys.rand(bst.max[0], bst.max[1]);
                }
            }
        }
        if ("inver" in rules && chance(rules.inver.chance)) {
            out.inver = true;
        }
        if ("noLegendaries" in rules && chance(rules.noLegendaries.chance)) {
            out.noLegendaries = true;
        }
        if ("rewards" in rules) {
            var rew = rules.rewards;
            var set = randomSample(rew.chance);
            if (set in rew.sets) {
                out.rewards = rew.sets[set];
            }
        }

        return out;
    };
    this.translateRules = function(rules) {
        var out = [], list, e;

        if (!rules) {
            return "No special rules";
        }

        if ("bonusTypes" in rules && rules.bonusTypes.length > 0) {
            out.push("Buffed Types: " + readable(rules.bonusTypes, "and"));
        }
        if ("excludeTypes" in rules && rules.excludeTypes.length > 0) {
            if (rules.excludeTypes.length > Object.keys(effectiveness).length / 2) {
                list = [];
                for (e in effectiveness) {
                    if (!rules.excludeTypes.contains(e)) {
                        list.push(e);
                    }
                }
                out.push("Recommended Types: " + readable(list, "and"));
            } else {
                out.push("Nerfed Types: " + readable(rules.excludeTypes, "and"));
            }
        }
        if (rules.noLegendaries) {
            out.push("Legendaries Forbidden");
        }
        if (rules.inver) {
            out.push("Inverted Type Effectiveness");
        }
        if ("minBST" in rules && "maxBST" in rules) {
            out.push("Recommended BST: " + rules.minBST + "~" + rules.maxBST);
        } else {
            if ("minBST" in rules) {
                out.push("Recommended BST: " + rules.minBST + " or more");
            }
            if ("maxBST" in rules) {
                out.push("Recommended BST: " + rules.maxBST + " or less");
            }
        }
        if ("excludeBalls" in rules && rules.excludeBalls.length > 0) {
            if (rules.excludeBalls.length > allBalls.length / 2) {
                list = [];
                for (e = 0; e < allBalls.length; e++) {
                    if (!rules.excludeBalls.contains(allBalls[e])) {
                        list.push(allBalls[e]);
                    }
                }
                out.push("Allowed Balls: " + readable(list.map(finishName), "and"));
            } else {
                out.push("Forbidden Balls: " + readable(rules.excludeBalls.map(finishName), "and"));
            }
        }
        if ("rewards" in rules) {
            list = [];
            for (var e in rules.rewards) {
                list.push(rules.rewards[e] + " " + itemAlias(e, false, true) + (rules.rewards[e] === 1 ? "" : "s"));
            }
            if (list.length > 1 || list[0] !== "10 Gachapon Tickets") {
                out.push("Reward: " + readable(list, "and"));
            }
        }

        if (out.length === 0) {
            return "No special rules";
        }

        return out.join(" | ");
    };
    this.createWild = function(dexNum, makeShiny, amt, bstLimit, leader, player) {
        var num,
            pokeId,
            shiny = sys.rand(0, shinyChance) < 1,
            maxStats,
            amount = amt || 1,
            ignoreForms = false;

        if (amount > 1) {
            shiny = false;
        }
        if (makeShiny) {
            shiny = true;
        }
        if (dexNum) {
            num = parseInt(dexNum, 10);
            pokeId = poke(num);
            if (makeShiny) {
                pokeId = poke(dexNum);
            }
        } else {
            if (currentTheme) {
                var theme = contestThemes[currentTheme];
                maxStats = sys.rand(theme.minBST || 300, theme.maxBST || 601);
                var list = [], bst, e, id;
                for (e = 1; e < 722; e++) {
                    bst = "customBST" in theme && e in theme.customBST ? theme.customBST[e] : getBST(e);
                    if (this.validForTheme(e, currentTheme) && bst <= maxStats) {
                        list.push(e);
                    }
                }
                for (e in theme.include) {
                    id = theme.include[e];
                    bst = "customBST" in theme && id in theme.customBST ? theme.customBST[id] : getBST(id);
                    if (this.validForTheme(id, currentTheme) && bst <= maxStats && list.indexOf(id) === -1) {
                        list.push(id);
                    }
                }
                if (list.length === 0) {
                    return;
                }
                num = list[sys.rand(0, list.length)];
                pokeId = poke(num + (shiny ? "" : 0));
                ignoreForms = true;
            }
            else {
                var maxRoll = bstLimit || 600;
                maxStats = sys.rand(300, maxRoll);
                if (leader) {
                    var list = [], loops = 0, found = false,
                        atk1 = sys.type(sys.pokeType1(leader)),
                        atk2 = sys.type(sys.pokeType2(leader));

                    do {
                        num = sys.rand(1, 722);
                        if (getBST(num) <= maxStats) {
                            var typeBonus = this.checkEffective(atk1, atk2, sys.type(sys.pokeType1(num)), sys.type(sys.pokeType2(num)));
                            if (player.costume === "inver") {
                                if (typeBonus === 0) {
                                    typeBonus = 0.5;
                                }
                                typeBonus = 1/typeBonus;
                            }
                            if (typeBonus > 1) {
                                found = true;
                                break;
                            } else {
                                list.push(num);
                            }
                        }
                        loops++;
                    } while (list.length < 7 && loops < 50);

                    if (!found) {
                        if (list.length === 0) {
                            do {
                                num = sys.rand(1, 722);
                                pokeId = poke(num + (shiny ? "" : 0));
                            } while (!pokeId || getBST(num) > maxStats);
                        } else {
                            num = list[sys.rand(0, list.length)];
                        }
                    }
                    pokeId = poke(num + (shiny ? "" : 0));
                } else {
                    do {
                        num = sys.rand(1, 722);
                        pokeId = poke(num + (shiny ? "" : 0));
                    } while (!pokeId || getBST(num) > maxStats);
                }
            }
        }
        if (isLegendary(num) && !dexNum) {
            amount = 1;
        }

        if (!ignoreForms && num in wildForms) {
            var pickedForm = sys.rand(0, wildForms[num] + 1);
            num = pokeInfo.calcForme(num, pickedForm);
        }
        pokeId = poke(num + (shiny ? "" : 0));
        currentPokemon = shiny ? "" + num : num;
        currentPokemonCount = amount;
        currentThrows = Math.floor(((amount + 1) / 2 * maxThrows));
        if (amount > 1) {
            var ret = [];
            ret += "<hr><center>A horde of wild " + pokeId + " appeared! <i>(BST: " + getBST(num) + ")</i><br/>";
            for (var i = 0; i < amount; i++) {
                ret += pokeInfo.sprite(currentPokemon);
            }
            ret += "</center><hr>";
            sys.sendHtmlAll(ret, safchan);
        } else {
            sys.sendHtmlAll("<hr><center>" + (shiny ? "<font color='DarkOrchid'>" : "") + "A wild " + pokeId + " appeared! <i>(BST: " + getBST(num) + ")</i>" + (shiny ? "</font>" : "") + "<br/>" + (wildEvent ? "<b>This is an Event Pokémon! No Master Balls allowed!</b><br/>" : "") + pokeInfo.sprite(currentPokemon) + "</center><hr>", safchan);
        }
        var onChannel = sys.playersOfChannel(safchan);
        for (var e in onChannel) {
            ballMacro(onChannel[e]);
        }
        preparationPhase = sys.rand(5, 8);
        preparationThrows = {};
        preparationFirst = null;
        if (contestCount > 0) {
            this.compileThrowers();
        }
        lastWild = now();
    };
    this.validForTheme = function(pokeId, name) {
        var theme = contestThemes[name];
        var pokeNum = parseInt(pokeId, 10);

        if (theme.exclude.indexOf(pokeNum) !== -1) {
            return false;
        }
        if (theme.include.indexOf(pokeNum) !== -1) {
            return true;
        }
        for (var e in theme.excludeTypes) {
            if (hasType(pokeNum, theme.excludeTypes[e])) {
                return false;
            }
        }
        for (e in theme.types) {
            //Legendary can only be manually added.
            if (hasType(pokeNum, theme.types[e]) && !isLegendary(pokeNum)) {
                return true;
            }
        }
        return false;
    };
    this.throwBall = function(src, data, bypass, suppress) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        if (!suppress && !bypass) {
            for (var t = 0; t < player.trackers.length; t++) {
                safaribot.sendMessage(sys.id(player.trackers[t]), "[Track] " + sys.name(src) + " is using /catch " + data + " (Time since last wild/trick: " + ((now() - lastWild)/1000) + " seconds)", safchan);
            }
        }
        if (!currentPokemon) {
            if (suppress) {
                safaribot.sendMessage(src, "Someone caught the wild Pokémon before you could throw!", safchan);
            } else {
                safaribot.sendMessage(src, "No wild Pokémon around!", safchan);
            }
            return;
        }
        if (player.pokemon.length >= player.balls.box * itemData.box.bonusRate) {
            safaribot.sendMessage(src, "You can't catch any new Pokémon because all your boxes are full! Please buy a new box with /buy.", safchan);
            return;
        }
        if (this.isBattling(sys.name(src))) {
            safaribot.sendMessage(src, "You can't catch a Pokémon and battle at the same time!", safchan);
            return;
        }
        if (this.isInAuction(sys.name(src))) {
            safaribot.sendMessage(src, "You can't catch a Pokémon while participating in an auction!", safchan);
            return;
        }
        var currentTime = now();
        if (!bypass && (!preparationFirst || sys.name(src).toLowerCase() !== preparationFirst.toLowerCase()) && player.cooldowns.ball > currentTime) {
            safaribot.sendMessage(src, "Please wait " + (Math.floor((player.cooldowns.ball - currentTime)/1000) + 1) + " seconds before throwing a ball!", safchan);
            return;
        }

        var ball = itemAlias(data);
        if (!isBall(ball)) {
            ball = "safari";
        }
        var ballBonus = itemData[ball].ballBonus;
        var cooldown = itemData[ball].cooldown;

        if (isNaN(player.balls[ball])) {
            player.balls[ball] = 0;
        }
        if (!(ball in player.balls) || player.balls[ball] <= 0) {
            safaribot.sendMessage(src, "You have no " + cap(ball) + " Balls!", safchan);
            return;
        }

        if (wildEvent && ball == "master") {
            safaribot.sendMessage(src, "This is an Event Pokémon, you cannot use Master Ball!", safchan);
            return;
        }
        if (currentRules && currentRules.excludeBalls && currentRules.excludeBalls.contains(ball)) {
            safaribot.sendMessage(src, "The use of " + itemAlias(ball, true, true) + " is forbidden during this contest!", safchan);
            return;
        }

        var name = sys.name(src);
        if (contestCount > 0 && contestantsWild.indexOf(name.toLowerCase()) === -1) {
            contestantsWild.push(name.toLowerCase());
        }

        if (preparationPhase > 0) {
            safaribot.sendMessage(src, "You are preparing to throw your " + cap(ball) + " Ball!", safchan);
            preparationThrows[sys.name(src)] = ball;
            return;
        }

        player.balls[ball] -= 1;
        this.updateShop(sys.name(src), ball);
        var pokeName = poke(currentPokemon);
        var wild = typeof currentPokemon == "string" ? parseInt(currentPokemon, 10) : currentPokemon;
        var shinyChance = typeof currentPokemon == "string" ? 0.30 : 1;
        var legendaryChance = isLegendary(currentPokemon) ? 0.50 : 1;

        var userStats = getBST(player.party[0]);
        if (userStats <= itemData.eviolite.threshold) {
            userStats += Math.min(itemData.eviolite.bonusRate * player.balls.eviolite, itemData.eviolite.maxRate);
        }
        var wildStats = getBST(wild);
        var statsBonus = (userStats - wildStats) / 6000;

        if (ball === "myth") {
            shinyChance = 1;
            legendaryChance = 1;
            if (isLegendary(wild)){
                ballBonus = itemData[ball].bonusRate;
            }
        }
        if (ball === "heavy" && wildStats >= 450) {
            ballBonus = 1 + itemData[ball].bonusRate * (Math.floor((wildStats - 450) / 30) + 1);
            if (ballBonus > itemData[ball].maxBonus) {
                ballBonus = itemData[ball].maxBonus;
            }
        }
        if (ball === "premier" && hasType(player.party[0], "normal") && hasType(player.party[0], "???") && player.costume !== "inver") {
            ballBonus = itemData[ball].bonusRate;
        }
        var typeBonus = this.checkEffective(sys.type(sys.pokeType1(player.party[0])), sys.type(sys.pokeType2(player.party[0])), sys.type(sys.pokeType1(wild)), sys.type(sys.pokeType2(wild)));
        if (player.costume === "inver" || (currentRules && currentRules.inver)) {
            if (typeBonus === 0) {
                typeBonus = 0.25;
            }
            typeBonus = 1/typeBonus;
        }

        var tiers = ["ORAS LC", "ORAS NU", "ORAS LU", "ORAS UU", "ORAS OU", "ORAS Ubers"];
        var tierChance = 0.02;
        for (var x = 0; x < tiers.length; x++) {
            if (sys.isPokeBannedFromTier && !sys.isPokeBannedFromTier(wild, tiers[x])) {
                tierChance = [0.20, 0.18, 0.14, 0.11, 0.07, 0.03][x];
                break;
            }
        }
        var leader = parseInt(player.party[0], 10);
        var species = pokeInfo.species(leader);
        var dailyBonus = dailyBoost.pokemon == species && !isMega(leader) ? dailyBoost.bonus : 1;
        var rulesMod = currentRules ? this.getRulesMod(leader, currentRules) : 1;

        var finalChance = (tierChance + statsBonus) * typeBonus * shinyChance * legendaryChance * dailyBonus * rulesMod;
        if (finalChance <= 0) {
            finalChance = 0.01;
        }
        finalChance *= ballBonus;
        if (ball == "clone" && finalChance > itemData[ball].bonusRate) {
            finalChance = itemData[ball].bonusRate;
            if (player.costume === "scientist") {
                finalChance += costumeData.scientist.bonusRate;
            }
        }

        var rng = Math.random();
        var flee;
        if (rng < finalChance || ballBonus == 255) {
            currentPokemonCount--;
            var amt = currentPokemonCount;
            var remaining = " There " + (amt > 1 ? "are" : "is") + " still " + currentPokemonCount + " " + pokeName + " left to catch!";
            if (amt < 1) {
                sys.sendAll("", safchan);
            }
            if (ball == "spy") {
                safaribot.sendAll("Some stealthy person caught the " + pokeName + " with a " + cap(ball) + " Ball and the help of their well-trained spy Pokémon!" + (amt > 0 ? remaining : ""), safchan);
            } else {
                safaribot.sendAll(name + " caught the " + pokeName + " with a " + cap(ball) + " Ball and the help of their " + poke(player.party[0]) + "!" + (amt > 0 ? remaining : ""), safchan);
            }
            safaribot.sendMessage(src, "Gotcha! " + pokeName + " was caught with a " + cap(ball) + " Ball! You still have " + player.balls[ball] + " " + cap(ball) + " Ball(s)!", safchan);
            player.pokemon.push(currentPokemon);
            player.records.pokesCaught += 1;

            if (ball == "clone") {
                safaribot.sendAll("But wait! The " + pokeName + " was cloned by the Clone Ball! " + name + " received another " + pokeName + "!", safchan);
                player.pokemon.push(currentPokemon);
                player.records.pokesCloned += 1;
            }

            if (ball == "luxury") {
                var perkBonus = 1 + Math.min(itemData.scarf.bonusRate * player.balls.scarf, itemData.scarf.maxRate);
                var earnings = Math.floor(wildStats/2 * perkBonus);
                safaribot.sendAll((player.balls.scarf > 0 ? "The Fashionable " : "") + name + " found $" + addComma(earnings) + " on the ground after catching " + pokeName + "!" , safchan);
                player.money += earnings;
                player.records.luxuryEarnings += earnings;
            }
            this.fullBoxWarning(src);

            var costumeBonus = (player.costume === "ace" ? costumeData.ace.bonusRate : 0);
            var penalty = 2 - Math.min(itemData.soothe.bonusRate * player.balls.soothe, itemData.soothe.maxRate) - costumeBonus;
            cooldown *= penalty;
            if (contestCount > 0) {
                var nameLower = name.toLowerCase();
                if (!(nameLower in contestCatchers)) {
                    contestCatchers[nameLower] = [];
                }
                contestCatchers[nameLower].push(currentPokemon);
                if (ball == "clone") {
                    contestCatchers[nameLower].push(currentPokemon);
                }
            }
            if (amt < 1) {
                sys.sendAll("", safchan);
                currentPokemon = null;
                wildEvent = false;
            } else {
                currentThrows -= Math.floor(maxThrows/2 + 5); //each caught pokemon makes the horde more likely to flee by a large amount
                if (currentThrows <= 0 && !wildEvent) {
                    flee = true;
                }
            }
        } else {
            var keep = false;
            if (player.costume === "fisher") {
                var rng2 = Math.random();
                if (rng2 < costumeData.fisher.keepRate) {
                    keep = true;
                    player.balls[ball] += 1;
                }
            }
            safaribot.sendMessage(src, "You threw a  " + cap(ball) + " Ball at " + pokeName +"! " + (keep ? "A quick jerk of your fishing rod snags the " + finishName(ball) + " you just threw, allowing you to recover it!" : "") + " You still have " + player.balls[ball] + " " + cap(ball) + " Ball(s)!", safchan);
            if (rng < finalChance + 0.1) {
                safaribot.sendMessage(src, "Gah! It was so close, too! ", safchan);
            } else if (rng < finalChance + 0.2) {
                safaribot.sendMessage(src, "Aargh! Almost had it! ", safchan);
            } else if (rng < finalChance + 0.3) {
                safaribot.sendMessage(src, "Aww! It appeared to be caught! ", safchan);
            } else {
                safaribot.sendMessage(src, "Oh no! The " + pokeName + " broke free! ", safchan);
            }
            safaribot.sendAll(pokeName + " broke out of " + (ball == "spy" ? "an anonymous person" : name) + "'s " + cap(ball) + " Ball!", safchan);
            player.records.pokesNotCaught += 1;

            currentThrows -= 1;
            if (currentThrows <= 0 && !wildEvent) {
                flee = true;
            }
        }

        if (flee) {
            var runmsgs = [
                "The wild {0} got spooked and ran away!",
                "The wild {0} got hungry and went somewhere else to find food!",
                "The wild {0} went back home to take their medicine!",
                "The wild {0} hid in a hole and disappeared!",
                "The wild {0} pointed to the sky. While everyone was looking at the clouds, the {0} ran away!"
            ];
            
            sys.sendAll("", safchan);
            safaribot.sendAll(runmsgs.random().format(pokeName), safchan);
            sys.sendAll("", safchan);
            currentPokemon = null;
            currentPokemonCount = 1;
        }

        player.cooldowns.ball = currentTime + cooldown;
        player.cooldowns.ballUse = player.cooldowns.ball;

        this.saveGame(player);
    };
    this.checkEffective = function(atk1, atk2, def1, def2) {
        var result = 1;
        var immuneCount = 0;
        var typeCount = 1;

        var countImmune = function(value) {
            if (value === 0) {
                immuneCount++;
                return immuneMultiplier;
            }
            return value;
        };

        var attacker = effectiveness[atk1];
        if (def1 in attacker) {
            result *= countImmune(attacker[def1]);
        }
        if (def2 in attacker) {
            result *= countImmune(attacker[def2]);
        }

        if (atk2 !== "???") {
            typeCount++;
            attacker = effectiveness[atk2];
            if (def1 in attacker) {
                result *= countImmune(attacker[def1]);
            }
            if (def2 in attacker) {
                result *= countImmune(attacker[def2]);
            }
        }
        if (immuneCount >= typeCount) {
            return 0;
        }

        return result;
    };
    this.getRulesMod = function(pokeId, rules) {
        var NERF = 0.25;
        var BUFF = 1.30;
        var type1 = sys.type(sys.pokeType1(pokeId)),
            type2 = sys.type(sys.pokeType2(pokeId)),
            bst = getBST(pokeId);

        if ("excludeTypes" in rules && (rules.excludeTypes.contains(type1) || rules.excludeTypes.contains(type2))) {
            return NERF;
        }
        if ("minBST" in rules && bst < rules.minBST) {
            return NERF;
        }
        if ("maxBST" in rules && bst > rules.maxBST) {
            return NERF;
        }
        if (rules.noLegendaries && isLegendary(pokeId)) {
            return NERF;
        }
        if ("bonusTypes" in rules && (rules.bonusTypes.contains(type1) || rules.bonusTypes.contains(type2))) {
            return BUFF;
        }
        return 1;
    };
    this.throwBait = function (src, commandData) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        for (var t = 0; t < player.trackers.length; t++) {
            safaribot.sendMessage(sys.id(player.trackers[t]), "[Track] " + sys.name(src) + " is using /bait " + commandData, safchan);
        }
        if (currentPokemon) {
            safaribot.sendMessage(src, "There's already a wild Pokémon around!", safchan);
            return;
        }
        if (contestCooldown <= 13) {
            safaribot.sendMessage(src, "A contest is about to start, the Pokémon will run away if you throw a bait now!", safchan);
            return;
        }
        if (this.isBattling(sys.name(src))) {
            safaribot.sendMessage(src, "You can't throw a bait during a battle!", safchan);
            return;
        }
        if (this.isInAuction(sys.name(src))) {
            safaribot.sendMessage(src, "You can't catch throw a bait while participating in an auction!", safchan);
            return;
        }
        if (player.cooldowns.ballUse > now()) {
            safaribot.sendMessage(src, "You used a ball recently, so please wait " + timeLeft(player.cooldowns.ballUse) + " seconds before throwing a bait!", safchan);
            return;
        }
        if (lastBaiters.indexOf(sys.name(src)) !== -1) {
            safaribot.sendMessage(src, "You just threw some bait not too long ago. Let others have a turn!", safchan);
            return;
        }

        var item = "bait";
        if (!(item in player.balls) || player.balls[item] <= 0) {
            safaribot.sendMessage(src, "You have no " + cap(item) + "!", safchan);
            return;
        }
        if (player.pokemon.length >= player.balls.box * itemData.box.bonusRate) {
            safaribot.sendMessage(src, "You can't catch any new Pokémon because all your boxes are full! Please buy a new box with /buy.", safchan);
            return;
        }
        if (contestCount > 0) {
            safaribot.sendMessage(src, "Contest rules forbid the use of Bait. Please wait until the Contest is over.", safchan);
            return;
        }
        if (baitCooldown > 0) {
            safaribot.sendMessage(src, "Please wait " + baitCooldown + " seconds before trying to attract another Pokémon with bait!", safchan);
            return;
        }
        var ballUsed = isBall(commandData.toLowerCase()) ? commandData.toLowerCase() : "safari";
        ballUsed = toUsableBall(player, ballUsed);
        if (!ballUsed) {
            safaribot.sendMessage(src, "If you throw a bait now, you will have no way to catch a Pokémon because you are out of balls!", safchan);
            return;
        }
        player.balls[item] -= 1;
        player.records.baitUsed += 1;

        var rng = Math.random();
        var perkBonus = Math.min(itemData.honey.bonusRate * player.balls.honey, itemData.honey.maxRate);
        var costumeBonus = (player.costume === "aroma" ? costumeData.aroma.bonusRate : 0);


        if (rng < (itemData.bait.successRate + perkBonus + costumeBonus)) {
            safaribot.sendAll((ballUsed == "spy" ? "Some stealthy person" : sys.name(src)) + " left some bait out. The bait attracted a wild Pokémon!", safchan);
            baitCooldown = successfulBaitCount = itemData.bait.successCD + sys.rand(0,10);
            player.records.baitAttracted += 1;

            if (lastBaiters.length >= lastBaitersAmount) {
                lastBaiters.shift();
            }
            lastBaiters.push(sys.name(src));

            safari.createWild(null, null, 1, null, player.party[0], player);
            safari.throwBall(src, ballUsed, true);
            preparationFirst = sys.name(src);
            lastBaitersDecay = lastBaitersDecayTime;
        } else {
            baitCooldown = itemData.bait.failCD + sys.rand(0,5);
            safaribot.sendAll((ballUsed == "spy" ? "Some stealthy person" : sys.name(src)) + " left some bait out... but nothing showed up.", safchan);
            player.records.baitNothing += 1;
            if (player.costume === "chef") {
                var rng2 = Math.random();
                if (rng2 < costumeData.chef.keepRate) {
                    player.balls[item] += 1;
                    safaribot.sendMessage(src, "If you sauté this bait just right, it will be usable again. Only a Master Chef like you could accomplish this feat!", safchan);
                }
            }
        }
        safaribot.sendMessage(src, "You still have " + player.balls[item] + " Baits remaining.", safchan);
        this.saveGame(player);
    };
    this.throwRock = function (src, commandData) {
        if (!validPlayers("both", src, commandData, "You cannot throw a " + itemData.rock.fullName + " at yourself!")) {
            return;
        }
        var player = getAvatar(src);
        var currentTime = now();
        if (player.cooldowns.rock > currentTime) {
            safaribot.sendMessage(src, "Please wait " + (Math.floor((player.cooldowns.rock - currentTime)/1000) + 1) + " seconds before trying to a throw another " + itemData.rock.fullName + "!", safchan);
            return;
        }
        var item = "rock";
        if (!(item in player.balls) || player.balls[item] <= 0) {
            safaribot.sendMessage(src, "You have no " + itemData.rock.fullName + "s!", safchan);
            return;
        }

        player.balls[item] -= 1;
        player.records.rocksThrown += 1;

        var rng = Math.random();
        var rng2 = Math.random();
        var success = (preparationPhase > 0 ? 0.15 : itemData.rock.successRate);
        var targetName = utilities.non_flashing(commandData.toCorrectCase());
        var targetId = sys.id(commandData);
        var target = getAvatar(targetId);

        if (commandData.toLowerCase() === preparationFirst) {
            success = 0;
        }

        var verb = "frozen"; //change to stunned, seasonal change
        if (rng < success) {
            if (rng2 < 0.4) {
                safaribot.sendAll(sys.name(src) + " threw a " + itemData.rock.fullName + " at " + targetName + "! *THUD* A direct hit! " + targetName + " was " + verb + "!", safchan);
                target.cooldowns.ball = target.cooldowns.ball > currentTime ? target.cooldowns.ball + itemData.rock.targetCD : currentTime + itemData.rock.targetCD;
                player.records.rocksHit += 1;
                target.records.rocksHitBy += 1;
            }
            else if (rng2 < 0.5) {
                safaribot.sendAll(sys.name(src) + " threw a " + itemData.rock.fullName + " at " + targetName + "! " + targetName +" evaded, but their " + poke(target.party[0]) + " got hit and " + verb + "!", safchan);
                target.cooldowns.ball = target.cooldowns.ball > currentTime ? target.cooldowns.ball + Math.floor(itemData.rock.targetCD/2) : currentTime + Math.floor(itemData.rock.targetCD/2);
                player.records.rocksHit += 1;
                target.records.rocksHitBy += 1;
            }
            else if (rng2 < 0.55) {
                var dropped = sys.rand(4, 10);
                if (target.money < dropped) {
                    dropped = target.money || 1;
                }
                safaribot.sendAll(sys.name(src) + " threw a " + itemData.rock.fullName + " at " + targetName + ", but only hit their wallet! " + sys.name(src) + " then picked up the $" + dropped + " dropped by " + targetName + "!", safchan);
                if (player.money + dropped> moneyCap) {
                    safaribot.sendMessage(src, "But you could only keep $" + (moneyCap - player.money) + "!", safchan);
                    player.money = moneyCap;
                } else {
                    safaribot.sendMessage(src, "You received $" + dropped + "!", safchan);
                    player.money += dropped;
                }
                player.records.rocksWalletHit += 1;
                player.records.rocksWalletEarned += dropped;
                target.records.rocksWalletHitBy += 1;
                target.records.rocksWalletLost += dropped;
                safaribot.sendMessage(targetId, "You lost $" + dropped + "!", safchan);
                target.money = target.money - dropped < 0 ? 0 : target.money - dropped;
            }
            else {
                var parts = ["right leg", "left leg", "right arm", "left arm", "back"];
                safaribot.sendAll(sys.name(src) + " threw a " + itemData.rock.fullName + " at " + targetName + "! The " + itemData.rock.fullName + " hit " + targetName + "'s " + parts[sys.rand(0, parts.length)] + "!", safchan);
                player.records.rocksHit += 1;
                target.records.rocksHitBy += 1;
            }
        } else {
            if (rng2 < itemData.rock.bounceRate + (preparationPhase > 0 ? 0.4 : 0)) {
                //Seasonal change
                //safaribot.sendAll(sys.name(src) + " threw a " + itemData.rock.fullName + " at " + targetName + ", but it hit a wall and bounced back at " + sys.name(src) + "! *THUD* That will leave a mark on " + sys.name(src) + "'s face and pride!", safchan);
                safaribot.sendAll(sys.name(src) + " threw a " + itemData.rock.fullName + " at " + targetName + ", but it broke apart before it was thrown and covered " + sys.name(src) + " in snow! That will leave a mark on " + sys.name(src) + "'s face and pride!", safchan);

                player.cooldowns.ball = currentTime + itemData.rock.bounceCD;
                player.records.rocksBounced += 1;
            }
            else if (rng2 < 0.25) {
                safaribot.sendAll(sys.name(src) + " threw a " + itemData.rock.fullName + " at " + targetName + ", but " + targetName + " saw it coming and caught the " + itemData.rock.fullName + " with their mitten-covered hands!", safchan); //seasonal change
                if (target.balls.rock < itemCap) {
                    target.balls.rock += 1;
                    safaribot.sendMessage(targetId, "You received 1 " + itemData.rock.fullName + "!", safchan);
                } else {
                    safaribot.sendMessage(targetId, "But you couldn't keep the " + itemData.rock.fullName + " because you already have " + itemCap + "!", safchan);
                }
                player.records.rocksMissed += 1;
                target.records.rocksCaught += 1;
            }
            else if (rng2 < 0.35) {
                var dropped = sys.rand(10, 17);
                if (player.money < dropped) {
                    dropped = player.money || 1;
                }
                safaribot.sendAll(sys.name(src) + " threw a " + itemData.rock.fullName + " at " + targetName + ", but missed and broke their house's window! " + sys.name(src) + " had to pay $" + dropped + " to " + targetName + "!", safchan);
                if (target.money + dropped> moneyCap) {
                    safaribot.sendMessage(targetId, "But you could only keep $" + (moneyCap - target.money) + "!", safchan);
                    target.money = moneyCap;
                } else {
                    safaribot.sendMessage(targetId, "You received $" + dropped + "!", safchan);
                    target.money += dropped;
                }
                safaribot.sendMessage(src, "You lost $" + dropped + "!", safchan);
                player.money = player.money - dropped < 0 ? 0 : player.money - dropped;
                player.records.rocksMissedWindow += 1;
                player.records.rocksWindowLost += dropped;
                target.records.rocksDodgedWindow += 1;
                target.records.rocksWindowEarned += dropped;
            }
            else if (rng2 < 0.45) {
                var onChannel = sys.playersOfChannel(safchan);
                var randomTarget = onChannel[sys.rand(0, onChannel.length)];
                if (randomTarget != src && randomTarget != targetId && getAvatar(randomTarget)) {
                    safaribot.sendAll(sys.name(src) + " tried to throw a " + itemData.rock.fullName + " at " + targetName + ", but failed miserably and almost hit " + utilities.non_flashing(sys.name(randomTarget)) + "!", safchan);
                } else {
                    safaribot.sendAll(sys.name(src) + " threw a " + itemData.rock.fullName + " at " + targetName + "... but it missed!", safchan);
                }
                player.records.rocksMissed += 1;
                target.records.rocksDodged += 1;
            }
            else if (rng2 < 0.5) {
                var extraThrown = "safari";
                if (player.balls[extraThrown] > 0) {
                    safaribot.sendAll(sys.name(src) + " threw a " + itemData.rock.fullName + " at " + targetName + ", but it missed... To make things worse, " + sys.name(src) + " also dropped a " + finishName(extraThrown) + " that was stuck together with the " + itemData.rock.fullName + "!", safchan);
                    safaribot.sendMessage(src, "You lost 1 " + finishName(extraThrown) + "!", safchan);
                    player.balls[extraThrown] -= 1;
                } else {
                    safaribot.sendAll(sys.name(src) + " threw a " + itemData.rock.fullName + " at " + targetName + "... but it missed!", safchan);
                }
                player.records.rocksMissed += 1;
                target.records.rocksDodged += 1;
            }
            else {
                safaribot.sendAll(sys.name(src) + " threw a " + itemData.rock.fullName + " at " + targetName + "... but it missed!", safchan);
                player.records.rocksMissed += 1;
                target.records.rocksDodged += 1;
            }
        }
        player.cooldowns.rock = currentTime + itemData.rock.throwCD;
        this.saveGame(player);
    };
    this.useStick = function (src, commandData) {
        if (!validPlayers("both", src, commandData, "You cannot poke yourself with a stick!")) {
            return;
        }
        var player = getAvatar(src);
        var currentTime = now();
        if (player.cooldowns.stick > currentTime) {
            safaribot.sendMessage(src, "Please wait " + (Math.floor((player.cooldowns.stick - currentTime)/1000) + 1) + " seconds before using your stick!", safchan);
            return;
        }
        var item = "stick";
        if (!(item in player.balls) || player.balls[item] <= 0) {
            safaribot.sendMessage(src, "You have no " + cap(item) + "s!", safchan);
            return;
        }

        var targetName = utilities.non_flashing(commandData.toCorrectCase());

        safaribot.sendAll(sys.name(src) + " poked " + targetName + " with their stick.", safchan);

        player.cooldowns.stick = currentTime + itemData.stick.cooldown;
        this.saveGame(player);
    };
    this.gachapon = function (src, commandData) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        if (this.isBattling(sys.name(src))) {
            safaribot.sendMessage(src, "You can't use the Gachapon Machine during a battle!", safchan);
            return;
        }

        var currentTime = now();
        /*if (currentPokemon) {
            safaribot.sendMessage(src, "It's unwise to ignore a wild Pokémon in order to use a Gachapon Machine...", safchan);
            return;
        }*/
        if (player.cooldowns.gacha > currentTime) {
            safaribot.sendMessage(src, "Strict gambling regulations require you to wait " + timeLeft(player.cooldowns.gacha) + " seconds before you can use the Gachapon Machine again!", safchan);
            return;
        }
        if (this.isInAuction(sys.name(src))) {
            safaribot.sendMessage(src, "You can't use the Gachapon Machine while participating in an auction!", safchan);
            return;
        }
        /*if (contestCount > 0) {
            safaribot.sendMessage(src, "[Closed] For maintenance. Will be fixed by time the contest is over!", safchan);
            return;
        }*/
        var gach = "gacha";
        if (isNaN(player.balls[gach])) {
            player.balls[gach] = 0;
        }
        if (!(gach in player.balls) || player.balls[gach] <= 0) {
            safaribot.sendMessage(src, "You have no Gachapon Tickets!", safchan);
            return;
        }
        player.balls[gach] -= 1;
        player.records.gachasUsed += 1;
        var reward = randomSample(gachaItems);
        safaribot.sendMessage(src, "Gacha-PON! The Gachapon Machine has dispensed an item capsule. [Remaining Tickets: " + player.balls[gach] + "]", safchan);
        if (player.costume === "tech" && reward === "safari") {
            var rng = Math.random();
            if (rng < costumeData.tech.retryRate) {
                reward = randomSample(gachaItems);
            }
        }

        //Variable for higher quantity rewards later. Make better later maybe?
        var amount = 1;
        var rng = Math.random();
        if (rng < 0.01) {
            amount = 4;
        } else if (rng < 0.05) {
            amount = 3;
        } else if (rng < 0.15) {
            amount = 2;
        }
        var plural = amount > 1 ? "s" : "";

        var giveReward = true;
        switch (reward) {
            case "master":
                if (player.balls[reward] >= 1) {
                    safaribot.sendHtmlAll("<b>JACKP--</b> Wait a second... " + html_escape(sys.name(src)) + "'s Master Ball turned out to be a simple Safari Ball painted to look like a Master Ball! What a shame!", safchan);
                    safaribot.sendMessage(src, "You wiped the paint off of the ball and pocketed 1 Safari Ball for your troubles.", safchan);
                    reward = "safari";
                    amount = 1;
                    player.records.masterballsWon += 1;
                } else {
                    safaribot.sendHtmlAll("<b>JACKPOT! " + html_escape(sys.name(src)) + " just won a Master Ball from the Gachapon Machine!</b>", safchan);
                    safaribot.sendMessage(src, "You received a " + finishName(reward) + ".", safchan);
                    amount = 1;
                    player.records.masterballsWon += 1;
                }
            break;
            case "bait":
                safaribot.sendMessage(src, "A sweet, fruity aroma wafts through the air as you open your capsule. You received " + amount + " " + finishName(reward) + ".", safchan);
            break;
            case "rock":
                var snowball = itemData.rock.fullName === "Snowball";
                safaribot.sendMessage(src, "A " + (snowball ? "wet splashing sound" : "loud clunk" ) + " comes from the machine. Some prankster put " + (snowball ? "snow" : itemData.rock.name + "s") + " in the Gachapon Machine! You received  " + amount + " " + finishName(reward) + plural + ".", safchan);
            break;
            case "wild":
            case "horde":
                giveReward = false;
                if (currentPokemon) {
                    safaribot.sendAll(sys.name(src) + " goes to grab their item from the Gachapon Machine but the capsule was swiped by the wild Pokémon!", safchan);
                    player.records.capsulesLost += 1;
                } else if (contestCount > 0) {
                    giveReward = true;
                    reward = "safari";
                    amount = 1;
                    safaribot.sendMessage(src, "Bummer, only a Safari Ball. You received 1 " + finishName(reward) + ".", safchan);
                } else {
                    var mod = Math.random();
                    var spawn = true;
                    var spawnHorde = (reward === "horde");
                    safaribot.sendAll((commandData.toLowerCase() == "spy" ? "Some stealthy person" : sys.name(src)) + " goes to grab their item from the Gachapon Machine but the noise lured a " + finishName(reward) + "!", safchan);

                    if (mod < 0.13 || player.cooldowns.ballUse > currentTime) {
                        safaribot.sendAll("Unfortunately " + (spawnHorde ? "they" : "it") + " fled before anyone could try to catch "+ (spawnHorde ? "them" : "it") + "!", safchan);
                        spawn = false;
                    }

                    if (spawn) {
                        if (spawnHorde) {
                            safari.createWild(0, false, 3, 580);
                        } else {
                            safari.createWild();
                        }
                        if (commandData !== undefined) {
                            safari.throwBall(src, commandData, true);
                            preparationFirst = sys.name(src);
                        }
                    }
                }
            break;
            case "safari":
                amount = 1;
                safaribot.sendMessage(src, "Bummer, only a Safari Ball. You received 1 " + finishName(reward) + ".", safchan);
            break;
            case "gacha":
                var jackpot = Math.floor(gachaJackpot/10);
                safaribot.sendHtmlAll("<b>JACKPOT! " + html_escape(sys.name(src)) + " just won the Gachapon Ticket Jackpot valued at " + jackpot + " tickets!</b>", safchan);
                amount = jackpot;
                player.records.jackpotsWon += 1;
                safaribot.sendMessage(src, "You received " + jackpot + " Gachapon Tickets.", safchan);
                gachaJackpot = 100; //Reset jackpot for next player
            break;
            case "amulet":
            case "soothe":
            case "scarf":
            case "cell":
                amount = 1;
                safaribot.sendHtmlAll("<b>Sweet! " + sys.name(src) + " just won a " + finishName(reward) + " from Gachapon!</b>", safchan);
                safaribot.sendMessage(src, "You received a " + finishName(reward) + ".", safchan);
            break;
            case "bignugget":
            case "nugget":
                amount = 1;
                safaribot.sendAll("Nice! " + sys.name(src) + " just won a " + finishName(reward) + " from Gachapon!", safchan);
                safaribot.sendMessage(src, "You received a " + finishName(reward) + ".", safchan);
            break;
            case "gem":
                amount = 1;
                safaribot.sendAll("The Gachapon machine emits a bright flash of light as " + sys.name(src) + "  reaches for their prize. Despite being temporarily blinded, " + sys.name(src) + " knows they just won a " + finishName(reward) + " due to a very faint baaing sound!", safchan);
                safaribot.sendMessage(src, "You received an " + finishName(reward) + ".", safchan);
            break;
            case "pearl":
            case "stardust":
            case "starpiece":
            case "bigpearl":
                amount = 1;
                safaribot.sendMessage(src, "You received a " + finishName(reward) + ".", safchan);
            break;
            default:
                safaribot.sendMessage(src, "You received " + amount + " " + finishName(reward) + plural + ".", safchan);
            break;
        }
        if (giveReward) {
            rewardCapCheck(src, reward, amount);
        }

        player.cooldowns.gacha = currentTime + itemData.gacha.cooldown;
        this.saveGame(player);
        gachaJackpot += 1;
        SESSION.global().safariGachaJackpot = gachaJackpot;
    };
    this.useRareCandy = function(src, commandData) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        if (contestCount > 0) {
            safaribot.sendMessage(src, "You can't use Rare Candies during a contest!", safchan);
            return;
        }
        if (this.isBattling(sys.name(src))) {
            safaribot.sendMessage(src, "You can't use a Rare Candy during a battle!", safchan);
            return;
        }
        if (this.isInAuction(sys.name(src))) {
            safaribot.sendMessage(src, "You can't use a Rare Candy while participating in an auction!", safchan);
            return;
        }

        if (player.balls.rare < 1) {
            safaribot.sendMessage(src, "You have no Rare Candies!", safchan);
            return;
        }
        var input = commandData.split(":");

        var info = getInputPokemon(input[0].replace(/flabebe/gi, "flabébé"));
        var starter = input.length > 1 ? input[1].toLowerCase() : "*";
        var shiny = info.shiny;
        var num = info.num;
        if (!num) {
            safaribot.sendMessage(src, "Invalid Pokémon!", safchan);
            return;
        }
        var id = info.id;
        if (player.pokemon.indexOf(id) == -1) {
            safaribot.sendMessage(src, "You do not have that Pokémon!", safchan);
            return;
        }

        var species = pokeInfo.species(num);
        if (!(species in evolutions)) {
            safaribot.sendMessage(src, "This Pokémon cannot evolve!", safchan);
            return;
        }
        if (info.input in player.shop) {
            safaribot.sendMessage(src, "You need to remove this Pokémon from your shop before evolving them!", safchan);
            return;
        }

        var evoData = evolutions[species];
        var candiesRequired = evoData.candies || 2;
        if (candiesRequired > 1 && player.balls.rare < candiesRequired) {
            safaribot.sendMessage(src, info.name + " requires " + candiesRequired + " Rare Candies to evolve!", safchan);
            return;
        }

        var evolveStarter = true;
        if (player.starter == id) {
            var count = countRepeated(player.pokemon, id);
            if (count > 1) {
                if (starter == "starter") {
                    evolveStarter = true;
                } else if (starter == "normal") {
                    evolveStarter = false;
                } else {
                    safaribot.sendMessage(src, "This Pokémon is your starter, but you have more than one! To pick which one you want to evolve, type /rare " + info.input +":starter or /rare " + info.input +":normal.", safchan);
                    return;
                }
            }
        }

        var possibleEvo = evoData.evo;
        var evolveTo = Array.isArray(possibleEvo) ? evoData.evo[sys.rand(0, possibleEvo.length)] : possibleEvo;
        var forme = pokeInfo.forme(num);
        if (forme !== 0) {
            var tempForme = pokeInfo.calcForme(evolveTo, forme);
            if (sys.pokemon(tempForme).toLowerCase() !== "missingno") {
                evolveTo = tempForme;
            }
        }
        var evolvedId = shiny ? "" + evolveTo : evolveTo;

        var keep = false;
        if (player.costume === "breeder") {
            var rng = Math.random();
            if (rng < costumeData.breeder.keepRate) {
                candiesRequired -= 1;
                keep = true;
            }
        }
        player.balls.rare -= candiesRequired;
        this.updateShop(sys.name(src), "rare");
        player.records.pokesEvolved += 1;

        this.evolvePokemon(src, info, evolvedId, "evolved into", evolveStarter);
        this.logLostCommand(sys.name(src), "rare " + commandData, "evolved into " + poke(evolvedId));
        if (keep) {
            if (candiesRequired > 0) {
                candiesRequired += 1;
                safaribot.sendMessage(src, "Your " + info.name + " started to eat " + candiesRequired + " Rare Cand" + (candiesRequired > 1 ? "ies" : "y") + " but evolved into " + poke(evolvedId) + " before eating the last one!", safchan);
            } else {
                safaribot.sendMessage(src, "Due to your expertise in raising Pokémon, your " + info.name + " evolved without needing to eat any Rare Candies!", safchan);
            }
        } else {
            safaribot.sendMessage(src, "Your " + info.name + " ate " + candiesRequired + " Rare Cand" + (candiesRequired > 1 ? "ies" : "y") + " and evolved into " + poke(evolvedId) + "!", safchan);
        }
    };
    this.useMegaStone = function(src, commandData) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        if (contestCount > 0) {
            safaribot.sendMessage(src, "You can't use Mega Stones during a contest!", safchan);
            return;
        }
        if (this.isBattling(sys.name(src))) {
            safaribot.sendMessage(src, "You can't use Mega Stones during a battle!", safchan);
            return;
        }
        if (this.isInAuction(sys.name(src))) {
            safaribot.sendMessage(src, "You can't use a Mega Stone while participating in an auction!", safchan);
            return;
        }

        if (player.balls.mega < 1) {
            safaribot.sendMessage(src, "You have no Mega Stones!", safchan);
            return;
        }

        var info = getInputPokemon(commandData.replace(/flabebe/gi, "flabébé"));
        var shiny = info.shiny;
        var num = info.num;
        if (!num) {
            safaribot.sendMessage(src, "Invalid Pokémon!", safchan);
            return;
        }
        var id = info.id;
        if (player.pokemon.indexOf(id) == -1) {
            safaribot.sendMessage(src, "You do not have that Pokémon!", safchan);
            return;
        }

        var species = pokeInfo.species(num);
        if (!(species in megaEvolutions)) {
            safaribot.sendMessage(src, "This Pokémon cannot mega evolve!", safchan);
            return;
        }
        if (info.input in player.shop) {
            safaribot.sendMessage(src, "You need to remove this Pokémon from your shop before mega evolving them!", safchan);
            return;
        }

        var possibleEvo = megaEvolutions[species];
        var evolveTo = possibleEvo[sys.rand(0, possibleEvo.length)];
        var evolvedId = shiny ? "" + evolveTo : evolveTo;

        player.balls.mega -= 1;
        this.updateShop(sys.name(src), "mega");

        this.evolvePokemon(src, info, evolvedId, "mega evolved into", true);
        this.logLostCommand(sys.name(src), "mega " + commandData, "mega evolved into " + poke(evolvedId));
        player.megaTimers.push({
            id: evolvedId,
            expires: now() + (itemData.mega.duration * 24 * 60 * 60 * 1000),
            to: id
        });
        safaribot.sendMessage(src, "You used a Mega Stone on " + info.name + " to evolve them into " + poke(evolvedId) + "! They will revert after 72 hours!", safchan);
    };
    this.evolvePokemon = function(src, info, evolution, verb, evolveStarter) {
        var player = getAvatar(src);
        var id = info.id;
        var count = countRepeated(player.pokemon, id);
        if (id === player.starter && (count <= 1 || evolveStarter)) {
            player.starter = evolution;
        }
        var wasOnParty = player.party.indexOf(id) !== -1;

        player.pokemon.splice(player.pokemon.indexOf(id), 1, evolution);
        if (wasOnParty) {
            player.party.splice(player.party.indexOf(id), 1, evolution);
        }
        var evoInput = getInputPokemon(evolution + (typeof evolution == "string" ? "*" : ""));
        if (evolution === player.starter && evoInput.input in player.shop) {
            delete player.shop[evoInput.input];
            safaribot.sendMessage(src, evoInput.name + " was removed from your shop!", safchan);
        }

        sys.sendAll("", safchan);
        safaribot.sendHtmlAll(pokeInfo.icon(info.num) + " -> " + pokeInfo.icon(parseInt(evolution, 10)), safchan);
        safaribot.sendAll(sys.name(src) + "'s " + info.name + " " + verb + " " + poke(evolution) + "!", safchan);
        sys.sendAll("", safchan);
        this.saveGame(player);
    };
    this.releasePokemon = function(src, data) {
        var verb = "release";
        if (!canLosePokemon(src, data, verb)) {
            return;
        }
        var player = getAvatar(src);
        if (player.tradeban > now()) {
            safaribot.sendMessage(src, "You are banned from releasing for " + timeLeftString(player.tradeban) + "!", safchan);
            return;
        }
        if (data === "*") {
            safaribot.sendMessage(src, "To release a Pokémon, use /release [name]:confirm!", safchan);
            return;
        }
        if (this.isBattling(sys.name(src))) {
            safaribot.sendMessage(src, "You can't release a Pokémon during a battle!", safchan);
            return;
        }
        if (this.isInAuction(sys.name(src))) {
            safaribot.sendMessage(src, "You can't release a Pokémon while participating in an auction!", safchan);
            return;
        }
        if (currentPokemon) {
            safaribot.sendMessage(src, "There's already a Pokemon out there!", safchan);
            return true;
        }
        if (releaseCooldown > 0) {
            safaribot.sendMessage(src, "Please spend the next  " + releaseCooldown + " seconds saying good bye to your Pokémon before releasing it!", safchan);
            return;
        }
        var input = data.split(":");
        var info = getInputPokemon(input[0].replace(/flabebe/gi, "flabébé"));
        var shiny = info.shiny;
        var num = info.num;
        var id = info.id;

        if (input.length < 2 || input[1].toLowerCase() !== "confirm") {
            safaribot.sendMessage(src, "You can release your " + info.name + " by typing /release " + info.input + ":confirm.", safchan);
            return;
        }

        safaribot.sendAll(sys.name(src) + " released their " + info.name + "!", safchan);
        this.logLostCommand(sys.name(src), "release " + data);
        this.removePokemon(src, id);
        player.records.pokesReleased += 1;
        player.cooldowns.ball = now() + 20 * 1000;
        this.saveGame(player);
        releaseCooldown = releaseCooldownLength;
        safari.createWild(num, shiny);
    };
    this.revertMega = function(src) {
        var player = getAvatar(src);
        if (!player) {
            return;
        }
        var currentTime = now(), info;
        for (var e = player.megaTimers.length - 1; e >= 0; e--) {
            info = player.megaTimers[e];
            if (info.expires <= currentTime) {
                if (player.pokemon.indexOf(info.id) !== -1) {
                    this.evolvePokemon(src, getInputPokemon(info.id + (typeof info.id == "string" ? "*" : "")), info.to, "reverted to", true);
                }
                player.megaTimers.splice(e, 1);
            }
        }
    };
    this.findItem = function(src) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        var currentTime = now();
        if (player.cooldowns.itemfinder > currentTime) {
            safaribot.sendMessage(src, "Your Itemfinder needs to cool down otherwise it will overheat! Try again in " + timeLeft(player.cooldowns.itemfinder) + " seconds.", safchan);
            return;
        }
        var dailyCharges = player.balls.itemfinder,
            permCharges = player.balls.permfinder,
            totalCharges = dailyCharges + permCharges;
        if (totalCharges < 1) {
            safaribot.sendMessage(src, "You have no charges left for your Itemfinder!", safchan);
            return;
        }
        if (this.isInAuction(sys.name(src))) {
            safaribot.sendMessage(src, "You can't use the Itemfinder while participating in an auction!", safchan);
            return;
        }

        if (dailyCharges > 0 ) {
            player.balls.itemfinder -= 1;
            dailyCharges -= 1;
        } else {
            player.balls.permfinder -= 1;
            permCharges -= 1;
        }
        totalCharges -= 1;

        var reward = randomSample(finderItems);
        if (player.costume === "explorer" && reward === "nothing") {
            var rng = Math.random();
            if (rng < costumeData.explorer.retryRate) {
                reward = randomSample(finderItems);
            }
        }
        var amount = 1;

        var giveReward = true;
        var showMsg = true;
        switch (reward) {
            case "rare":
                safaribot.sendHtmlAll("<b>Beep. Beep. BEEP! " + sys.name(src) + " found a " + finishName(reward) + " behind a bush!</b>", safchan);
            break;
            case "recharge":
                reward = "permfinder";
                amount = 3;
                showMsg = false;
                safaribot.sendHtmlAll("<b>Pi-ka-CHUUU!</b> " + sys.name(src) + " was shocked by a Wild Pikachu while looking for items! On the bright side, " + sys.name(src) + "'s Itemfinder slightly recharged due to the shock.", safchan);
                safaribot.sendMessage(src, "Your Itemfinder gained " + amount + " charges [Remaining charges: " + (totalCharges + amount) + " (Daily " + dailyCharges + " plus " + Math.min(permCharges + amount, itemCap) + " bonus)].", safchan);
            break;
            case "crown":
                safaribot.sendHtmlAll("<b>BEEP! BEEPBEEP! Boop!?</b> " + sys.name(src) + "'s Itemfinder locates an old treasure chest full of ancient relics. Upon picking them up, they crumble into dust except for a single Relic Crown.", safchan);
            break;
            case "eviolite":
                safaribot.sendHtmlAll("<b>!PEEB !PEEB</b> Another trainer approaches " + sys.name(src) + " as they are looking for items and snickers: \"You have it on backwards.\" " + sys.name(src) + " corrects the position, turns around, and finds a sizeable chunk of Eviolite on the ground.", safchan);
            break;
            case "honey":
                safaribot.sendHtmlAll("<b>BEE! BEE! BEE!</b> " + sys.name(src) + " stumbled upon a beehive while using their Itemfinder. Before running off to avoid the swarm, " + sys.name(src) + " managed to steal a glob of Honey!", safchan);
            break;
            case "spy":
                safaribot.sendMessage(src, "Bep. Your Itemfinder is pointing towards a shadowy area. Within the darkness, you find a suspicious " + finishName(reward) + "!", safchan);
            break;
            case "gacha":
                safaribot.sendMessage(src, "Beeeep. You're led to a nearby garbage can by your Itemfinder. You decide to dig around anyway and find an unused " + finishName(reward) + "!", safchan);
            break;
            case "rock":
                safaribot.sendMessage(src, "Beep. Your Itemfinder pointed you towards a very conspicuous " + itemData.rock.fullName + ".", safchan);
            break;
            case "bait":
                safaribot.sendMessage(src, "Beep-Beep. Your Itemfinder pointed you towards a berry bush! You decided to pick one and put it in your bag.", safchan);
            break;
            case "pearl":
            case "stardust":
                safaribot.sendMessage(src, "Beep Beep Beep. You dig around a sandy area and unbury a " + finishName(reward) + "!", safchan);
            break;
            case "luxury":
                safaribot.sendMessage(src, "Be-Beep. You comb a patch of grass that your Itemfinder pointed you towards and found a " + finishName(reward) + "!", safchan);
            break;
            default:
                safaribot.sendMessage(src, "You pull out your Itemfinder ... ... ... But it did not detect anything. [Remaining charges: " + totalCharges + (permCharges > 0 ? " (Daily " + dailyCharges + " plus " + permCharges + " bonus)" : "") + "].", safchan);
                giveReward = false;
                showMsg = false;
            break;
        }
        if (showMsg) {
            safaribot.sendMessage(src, "You found a " + finishName(reward) + " with your Itemfinder! [Remaining charges: " + totalCharges + (permCharges > 0 ? " (Daily " + dailyCharges + " plus " + permCharges + " bonus)" : "") + "].", safchan);
        }
        if (giveReward) {
            player.records.itemsFound += 1;
            rewardCapCheck(src, reward, amount);
        }

        player.cooldowns.itemfinder = currentTime + itemData.itemfinder.cooldown;
        this.saveGame(player);
    };
    this.useItem = function(src, data) {
        if (!validPlayers("self", src)) {
            return;
        }
        if (this.isInAuction(sys.name(src))) {
            safaribot.sendMessage(src, "You can't use an item while participating in an auction!", safchan);
            return;
        }
        var player = getAvatar(src);
        var item = itemAlias(data, true);
        if (!(item in itemData)) {
            safaribot.sendMessage(src,  item + " is not a valid item!", safchan);
            return false;
        }

        if (itemData[item].type !== "consumable") {
            safaribot.sendMessage(src, item + " is not a usable item!", safchan);
        }

        if (player.balls[item] < 1) {
            safaribot.sendMessage(src, "You have no " + finishName(item) + "!", safchan);
            return;
        }

        if (item === "gem") {
            var chars = player.balls.itemfinder,
                gemdata = itemData.gem.charges,
                pchars = player.balls.permfinder + gemdata,
                tchars = chars + pchars;

            safaribot.sendHtmlMessage(src, "The Ampere Gem begins to emit a soft baaing sound. Your Itemfinder then lights up and responds with a loud <b>BAA~!</b>", safchan);
            safaribot.sendMessage(src, "Your Itemfinder gained " + gemdata + " charges. [Remaining Charges: " + tchars + " (Daily " + chars + " plus " + pchars + " bonus)].", safchan);
            rewardCapCheck(src, "permfinder", gemdata);
            player.balls.gem -= 1;
            this.updateShop(sys.name(src), "gem");
            return;
        }
    };
    this.challengePlayer = function(src, data) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        var name = sys.name(src).toLowerCase();
        if (data.toLowerCase() == "cancel") {
            if (name in challengeRequests) {
                delete challengeRequests[name];
            }
            safaribot.sendMessage(src, "You cancelled your challenge for a battle.", safchan);
            return;
        }

        if (name in challengeRequests) {
            var commandLink = "/challenge cancel";
            safaribot.sendHtmlMessage(src, "You already have a pending challenge! To cancel it, type <a href=\"po:send/" + commandLink + "\">" + commandLink + "</a>.", safchan);
            return;
        }

        if (contestCooldown <= 35 || contestCount > 0) {
            safaribot.sendMessage(src, "You cannot battle during a contest or when one is about to start!", safchan);
            return;
        }
        if (currentPokemon) {
            safaribot.sendMessage(src, "You cannot start a battle while a wild Pokémon is around!", safchan);
            return;
        }
        if (this.isBattling(name)) {
            safaribot.sendMessage(src, "You are already in a battle!", safchan);
            return;
        }
        if (this.isInAuction(sys.name(src))) {
            safaribot.sendMessage(src, "You can't battle while participating in an auction!", safchan);
            return;
        }

        if (!validPlayers("target", src, data, "You can't battle yourself!")) {
            return;
        }
        var targetId = sys.id(data);
        var target = getAvatar(targetId);
        var tName = sys.name(targetId).toLowerCase();
        if (this.isBattling(tName)) {
            safaribot.sendMessage(src, "This person is already battling! Wait for them to finish to challenge again!", safchan);
            return;
        }

        if (player.party.length < 3) {
            safaribot.sendMessage(src, "Your party must have at least 3 Pokémon to battle!", safchan);
            return;
        }

        if (tName in challengeRequests && challengeRequests[tName] == name) {
            if (target.party.length < 3) {
                safaribot.sendMessage(src, "Battle not started because " + sys.name(targetId) + " has less than 3 Pokémon in their party!", safchan);
                safaribot.sendMessage(targetId, "Your party must have at least 3 Pokémon to battle!", safchan);
                return;
            }
            var battle = new Battle(targetId, src);
            currentBattles.push(battle);

            delete challengeRequests[tName];
        } else {
            challengeRequests[name] = tName;
            var commandLink = "/challenge cancel";
            safaribot.sendHtmlMessage(src, "You are challenging " + sys.name(targetId) + " to a battle! Wait for them to accept, or cancel the challenge with <a href=\"po:send/" + commandLink + "\">" + commandLink + "</a>.", safchan);

            commandLink = "/challenge " + sys.name(src);
            sys.sendMessage(targetId, "", safchan);
            safaribot.sendHtmlMessage(targetId, sys.name(src) + " is challenging you for a battle! To accept, type <a href=\"po:send/" + commandLink + "\">" + commandLink + "</a>", safchan);
            sys.sendMessage(targetId, "", safchan);
        }
    };
    this.watchBattle = function(src, data) {
        if (!validPlayers("target", src, data)) {
            return;
        }
        var name = sys.name(src);
        var tName = sys.name(sys.id(data)).toLowerCase();

        var battle, b;
        for (b in currentBattles) {
            battle = currentBattles[b];
            if (battle.isInBattle(tName)) {
                if (battle.viewers.indexOf(name.toLowerCase()) !== -1) {
                    battle.sendToViewers(name + " stopped watching this battle!");
                    battle.viewers.splice(battle.viewers.indexOf(name.toLowerCase()), 1);
                } else {
                    battle.viewers.push(name.toLowerCase());
                    battle.sendToViewers(name + " is watching this battle!");
                }
                return;
            }
        }

        safaribot.sendMessage(src, "This person is not battling!", safchan);
    };
    this.questNPC = function(src, data) {
        if (!validPlayers("self", src)) {
            return;
        }
        if (data == "*") {
            sys.sendMessage(src, "", safchan);
            safaribot.sendMessage(src, "Quests available:", safchan);
            safaribot.sendMessage(src, "-Collector", safchan);
            safaribot.sendMessage(src, "-Scientist", safchan);
            safaribot.sendMessage(src, "-Arena", safchan);
            safaribot.sendMessage(src, "-Wonder", safchan);
            sys.sendMessage(src, "", safchan);
            safaribot.sendMessage(src, "For more information, type /quest [name] (example: /quest collector).", safchan);
            sys.sendMessage(src, "", safchan);
            return;
        }

        if (this.isInAuction(sys.name(src))) {
            safaribot.sendMessage(src, "You can't do any quest while participating in an auction!", safchan);
            return;
        }

        var info = data.split(":");
        var quest = info[0].toLowerCase();
        var args = info.slice(1);
        args = args.length > 0 ?  args : [];

        switch (quest) {
            case "collector":
                this.collectorQuest(src, args);
            break;
            case "scientist":
                this.scientistQuest(src, args);
            break;
            case "arena":
                this.fightNPC(src, args);
            break;
            case "wonder":
            case "wondertrade":
            case "wonder trade":
                this.wonderTrade(src, args);
            break;
            default:
                safaribot.sendMessage(src, "This is not a valid quest!", safchan);
        }
    };
    this.collectorQuest = function(src, data) {
        var player = getAvatar(src);
        var quest = player.quests.collector;
        var ongoing = quest.reward > 0;

        if (ongoing && now() > quest.deadline) {
            sys.sendMessage(src, "", safchan);
            safaribot.sendMessage(src, "Collector: I'm sorry, but since you took too long to fulfill my request I decided to buy from someone else!", safchan);
            safaribot.sendMessage(src, "Collector: If you still wish to help me, type /quest collector:start for a new request!", safchan);
            sys.sendMessage(src, "", safchan);

            quest.reward = 0;
            quest.requests = [];
            quest.cooldown = 0;
            quest.deadline = null;
            this.saveGame(player);
            return;
        }

        if (data.length < 1 || !data[0]) {
            if (ongoing) {
                sys.sendMessage(src, "", safchan);
                safaribot.sendMessage(src, "Collector: Hello, did you bring the " + readable(quest.requests.map(poke), "and") + " that I asked?", safchan);
                safaribot.sendMessage(src, "Collector: If you did, type /quest collector:finish and I will pay you $" + addComma(quest.reward) + " for those Pokémon, but please bring them in less than " + timeLeftString(quest.deadline) + ". ", safchan);
                safaribot.sendMessage(src, "Collector: You can also type /quest collector:abort if you no longer wish to help me.", safchan);
                sys.sendMessage(src, "", safchan);
            } else {
                safaribot.sendMessage(src, "Collector: Hello, I'm The Collector! I am always willing to pay well for some interesting Pokémon. If you wish to help me, type /quest collector:help.", safchan);
            }
            return;
        }

        var action = data[0].toLowerCase();

        switch (action) {
            case "information":
            case "info":
            case "help":
                    sys.sendMessage(src, "", safchan);
                    safaribot.sendMessage(src, "Collector: I love to collect Pokémon, but I'm not good at catching them. Therefore, I buy them!", safchan);
                    safaribot.sendMessage(src, "Collector: If you want to help me, type /quest collector:start:difficulty, and I will request some Pokémon for you to bring me.", safchan);
                    safaribot.sendMessage(src, "Collector: Once you have them, type /quest collector:finish, and I will pay about from 2.4x to 4.2x their normal value. After that, I will need some time to organize my collection, so I won't make any new request until I finish.", safchan);
                    safaribot.sendMessage(src, "Collector: If you wish to give up on my request, type /quest collector:abort.", safchan);
                    safaribot.sendMessage(src, "Collector: To learn more about the difficulty levels, type /quest collector:difficulty.", safchan);
                    sys.sendMessage(src, "", safchan);
            break;
            case "difficulty":
            case "level":
            case "levels":
                    sys.sendMessage(src, "", safchan);
                    safaribot.sendMessage(src, "Collector: My requests are organized into 4 different levels:", safchan);
                    safaribot.sendMessage(src, "Collector: Easy - Three Pokémon with BST between 180 and 320. Reward is 2.4x their price.", safchan);
                    safaribot.sendMessage(src, "Collector: Normal - Four Pokémon with BST between 320 and 460. Reward is 3.3x their price.", safchan);
                    safaribot.sendMessage(src, "Collector: Hard - Five Pokémon with BST between 460 and 600. Reward is 4.2x their price.", safchan);
                    safaribot.sendMessage(src, "Collector: Epic - Six Pokémon with BST between 500 and 720, with one of them being a Legendary. Reward is 9x their price.", safchan);
                    sys.sendMessage(src, "", safchan);
            break;
            case "start":
            case "begin":
                if (ongoing) {
                    safaribot.sendMessage(src, "Collector: Please fulfill my previous request before getting a new one! If you wish to give up this request, type /quest collector:abort.", safchan);
                    return;
                }
                if (quest.cooldown >= now()) {
                    safaribot.sendMessage(src, "Collector: I'm sorry, I'm currently organizing my collection. Please come back in " + timeLeftString(quest.cooldown) + "!", safchan);
                    return;
                }
                if (data.length < 2) {
                    safaribot.sendMessage(src, "Collector: Please choose a difficulty (Easy, Normal, Hard or Epic)! Type /quest collector:start:[difficulty] for that! Type /quest collector:difficulty to learn more about the different difficulty levels.", safchan);
                    return;
                }
                var diff = data[1].toLowerCase();

                var level = 1;
                switch (diff) {
                    case "easy":
                    case "[easy]":
                        level = 0;
                    break;
                    case "normal":
                    case "[normal]":
                    case "medium":
                        level = 1;
                    break;
                    case "hard":
                    case "[hard]":
                        level = 2;
                    break;
                    case "epic":
                    case "[epic]":
                        level = 3;
                    break;
                    default:
                        safaribot.sendMessage(src, "Collector: Please choose a difficulty (Easy, Normal or Hard)! Type /quest collector:start:[difficulty] for that!", safchan);
                        return;
                }


                var request = [];
                var difficultBonus = [2.4, 3.3, 4.2, 9][level];
                var minBST = [180, 320, 460, 500][level];
                var maxBST = [320, 460, 600, 720][level];
                var amount = [3, 4, 5, 5][level];
                var deadlineDays = 2;

                while (request.length < amount) {
                    var randomNum = sys.rand(1, 722);
                    var bst = getBST(randomNum);
                    if (!request.contains(randomNum) && bst >= minBST && bst <= maxBST && !isLegendary(randomNum)) {
                        request.push(randomNum);
                    }
                }
                if (level == 3) {
                    request.push(legendaries.random());
                }

                var reward = 0;
                for (e = 0; e < request.length; e++) {
                    reward += getPrice(request[e]);
                }

                var perkBonus = Math.min(itemData.amulet.bonusRate * player.balls.amulet, itemData.amulet.maxRate);
                quest.requests = request;
                quest.reward = Math.round(reward * (difficultBonus + perkBonus));
                quest.deadline = now() + deadlineDays * 24 * 60 * 60 * 1000;
                this.saveGame(player);
                sys.sendMessage(src, "", safchan);
                safaribot.sendMessage(src, "Collector: So you will help me? Great! Then bring me " + readable(request.map(poke), "and") + ", and I will pay you $" + addComma(quest.reward) + " for them!", safchan);
                safaribot.sendMessage(src, "Collector: But please don't take too long! If you take more than " + (deadlineDays * 24) + " hours, I may buy them from someone else!", safchan);
                sys.sendMessage(src, "", safchan);
            break;
            case "finish":
            case "complete":
                if (!ongoing) {
                    safaribot.sendMessage(src, "Collector: I don't recall requesting anything from you. Type /quest collector:help if you wish to help me.", safchan);
                    return;
                }
                if (contestCount > 0) {
                    safaribot.sendMessage(src, "You can't finish this quest during a contest.", safchan);
                    return;
                }
                if (currentPokemon) {
                    safaribot.sendMessage(src, "You can't finish this quest while there's a wild Pokémon around.", safchan);
                    return;
                }
                var e, hasPokemon = true, id;
                for (e = 0; e < quest.requests.length; e++) {
                    id = quest.requests[e];
                    if (!player.pokemon.contains(id)) {
                        safaribot.sendMessage(src, "Collector: You don't have a " + sys.pokemon(id) + "!", safchan);
                        hasPokemon = false;
                    }
                }
                if (!hasPokemon) {
                    return;
                }
                for (e = 0; e < quest.requests.length; e++) {
                    id = quest.requests[e];
                    if (!canLosePokemon(src, id + "", "give")) {
                        return;
                    }
                }
                if (player.party.length <= quest.requests.length) {
                    var allInParty = true;
                    for (e = 0; e < player.party.length; e++) {
                        if (!quest.requests.contains(player.party[e])) {
                            allInParty = false;
                            break;
                        }
                    }
                    if (allInParty) {
                        safaribot.sendMessage(src, "Collector: I can't possibly take these Pokémon while they are in your party!", safchan);
                        return;
                    }
                }
                player.money = Math.min(player.money + quest.reward, moneyCap);
                for (e = 0; e < quest.requests.length; e++) {
                    this.removePokemon(src, quest.requests[e]);
                }
                sys.sendMessage(src, "", safchan);
                safaribot.sendMessage(src, "Collector: Superb! You brought everything! Here's your payment!", safchan);
                safaribot.sendMessage(src, "You gave your " + readable(quest.requests.map(poke), "and") + " to the Collector and received $" + addComma(quest.reward) + "!", safchan);
                sys.sendMessage(src, "", safchan);

                this.logLostCommand(sys.name(src), "quest collector:" + data.join(":"), "gave " + readable(quest.requests.map(poke), "and"));
                player.records.collectorEarnings += quest.reward;
                player.records.collectorGiven += quest.requests.length;
                quest.reward = 0;
                quest.requests = [];
                quest.cooldown = now() + 3 * 60 * 60 * 1000;
                quest.deadline = 0;
                this.saveGame(player);
            break;
            case "abort":
            case "cancel":
            case "giveup":
            case "give up":
                if (!ongoing) {
                    safaribot.sendMessage(src, "Collector: You can't abort a quest even before you start it! Type /quest collector:help if you wish to help me.", safchan);
                    return;
                }
                safaribot.sendMessage(src, "Collector: Oh, you don't want to help me anymore? It's a shame, but I understand. Come back later if you change your mind!", safchan);
                quest.reward = 0;
                quest.requests = [];
                quest.cooldown = now() + 1 * 60 * 60 * 1000;
                quest.deadline = null;
                this.saveGame(player);
            break;
            default:
                safaribot.sendMessage(src, "Collector: I don't think I can help you with that. But if you wish to help me, type /quest collector:help!", safchan);
        }
    };
    this.scientistQuest = function(src, data) {
        var player = getAvatar(src);
        var quest = scientistQuest;
        var id = quest.pokemon;
        if (now() > quest.expires) {
            safaribot.sendMessage(src, "Scientist: I'm going to present my research results in a convention. Please come back later!", safchan);
            return;
        }
        if (player.quests.scientist.cooldown >= now() && player.quests.scientist.pokemon == id) {
            safaribot.sendMessage(src, "Scientist: That " + poke(id) + " that you brought earlier is really helping me! Come back in " + timeLeftString(quest.expires) + " to check my next research!", safchan);
            return;
        }

        if (!data[0]) {
            //Feel free to change these messages and the ones below if you get a better idea
            var typeResearch = {
                "Normal": "{0}'s genealogy",
                "Fighting": "how many martial arts a {0} can learn",
                "Flying": "{0}'s flying patterns",
                "Poison": "a possible cure for a {0}'s venom",
                "Ground": "how deep a {0} can dig into the earth",
                "Rock": "how a {0} moves if they are made of rocks",
                "Bug": "how a group of {0} work together in a colony",
                "Ghost": "if and how a {0} can move into the ethereal world",
                "Steel": "if {0}'s body is similar to industrial steel",
                "Fire": "{0}'s maximum body temperature",
                "Water": "how much percent of {0}'s body is composed of water",
                "Grass": "how the photosynthesis process works for {0}",
                "Electric": "how many houses a {0} could provide energy to",
                "Psychic": "if a {0} can read an human's mind",
                "Ice": "{0}'s minimum body temperature",
                "Dragon": "how tough a {0}'s fang is",
                "Dark": "if a {0} becomes stronger during the night",
                "Fairy": "if a {0} has magical powers"
            };
            var type = sys.type(sys.pokeType1(id));
            var researching = typeResearch[type].format(poke(id));
            type = sys.type(sys.pokeType2(id));
            type = type === "???" ? sys.type(sys.pokeType1(id)) : sys.type(sys.pokeType2(id));

            typeResearch = {
                "Normal": "how high they can jump",
                "Fighting": "how strong they are when compared to humans",
                "Flying": "how fast they can fly",
                "Poison": "which parts of their body is poisonous",
                "Ground": "their ability to level the ground",
                "Rock": "how many different minerals can be found in their body",
                "Bug": "in which environments they can camouflage themselves better",
                "Ghost": "if they can possess an human",
                "Steel": "what they eat since they are made of steel",
                "Fire": "how able they are to adapt to colder environments",
                "Water": "how deep they can dive into the sea",
                "Grass": "in which season they grow faster",
                "Electric": "if there's any side effect to storing electricity in their body",
                "Psychic": "how far they can exert their psychic powers",
                "Ice": "how able they are to adapt to warmer environments",
                "Dragon": "their expected lifespan",
                "Dark": "how smart they are",
                "Fairy": "if their charm spells can affect humans"
            };
            researching += " and " + typeResearch[type];


            sys.sendMessage(src, "", safchan);
            safaribot.sendMessage(src, "Scientist: Hello, my friend! I'm currently researching " + researching + ", so I would appreciate if you could bring one to me. If you do, I shall reward you with " + quest.reward + " Silver Coin" + (quest.reward == 1 ? "" : "s") + "!", safchan);
            safaribot.sendMessage(src, "Scientist: I expect to finish this research in about " + timeLeftString(quest.expires) + ". If you want to help me, bring them until then and type /quest scientist:finish.", safchan);
            sys.sendMessage(src, "", safchan);
            return;
        }

        if (data[0].toLowerCase() === "finish") {
            if (contestCount > 0) {
                safaribot.sendMessage(src, "You can't finish this quest during a contest.", safchan);
                return;
            }
            if (currentPokemon) {
                safaribot.sendMessage(src, "You can't finish this quest while there's a wild Pokémon around.", safchan);
                return;
            }
            if (!player.pokemon.contains(id)) {
                safaribot.sendMessage(src, "Scientist: You don't have a " + sys.pokemon(id) + "!", safchan);
                return;
            }
            if (!canLosePokemon(src, id + "", "give")) {
                return;
            }
            if (player.balls.silver + quest.reward > itemCap) {
                safaribot.sendMessage(src, "Scientist: I see you brought the Pokémon, but you are currently unable to carry any more Silver Coin! Come back after spending some of them!", safchan);
                return;
            }

            player.balls.silver += quest.reward;
            this.removePokemon(src, id);

            sys.sendMessage(src, "", safchan);
            safaribot.sendMessage(src, "Scientist: Oh, you brought the " + poke(id) + "! Here, have your Silver Coin" + (quest.reward == 1 ? "" : "s") + "!", safchan);
            safaribot.sendMessage(src, "You gave your " + poke(id) + " to the Scientist and received " + quest.reward + " Silver Coin" + (quest.reward == 1 ? "" : "s") + "!", safchan);
            sys.sendMessage(src, "", safchan);

            player.records.scientistEarnings += quest.reward;
            player.records.scientistGiven += 1;

            player.quests.scientist.cooldown = quest.expires;
            player.quests.scientist.pokemon = id;
            this.saveGame(player);
            this.logLostCommand(sys.name(src), "quest scientist:" + data.join(":"), "gave " + poke(id));
        } else {
            safaribot.sendMessage(src, "Scientist: I don't think I can help you with that.", safchan);
        }
    };
    this.changeScientistQuest = function(data) {
        var randomNum, bst;

        if (data) {
            randomNum = getInputPokemon(data).num;
            bst = getBST(randomNum);
        }
        if (!randomNum) {
            do {
                randomNum = sys.rand(1, 722);
                bst = getBST(randomNum);

            } while (bst > 600 || isLegendary(randomNum));
        }

        var reward = Math.floor((bst - 180)/50) + 2;
        scientistQuest = {
            pokemon: randomNum,
            reward: reward,
            expires: now() + 3 * 60 * 60 * 1000 - 3 * 60 * 1000
        };
        permObj.add("scientistQuest", JSON.stringify(scientistQuest));
    };
    this.fightNPC = function(src, data) {
        var player = getAvatar(src);

        if (data.length === 0) {
            sys.sendMessage(src, "", safchan);
            safaribot.sendMessage(src, "Arena Clerk: You want a battle? Then type /quest arena:name to pick who you want to fight!", safchan);
            safaribot.sendMessage(src, "Arena Clerk: You need to pay an entry fee and get some Silver Coins if you win! Type /quest arena:help for more details!", safchan);
            if (player.quests.arena.cooldown >= now()) {
                safaribot.sendMessage(src, "Arena Clerk: There's currently a long queue of people fighting in the Arena, so it may need to wait " + timeLeftString(player.quests.arena.cooldown) + " to try a challenge!", safchan);
            }
            sys.sendMessage(src, "", safchan);
            return;
        }
        var postBattle = function(name, isWinner, playerScore, npcScore, args) {
            var player = getAvatarOff(name);
            var id = sys.id(name);
            sys.sendMessage(id, "", safchan);
            if (isWinner) {
                player.balls.silver = Math.min(player.balls.silver + args.reward, itemCap);
                player.records.arenaWon += 1;
                player.records.arenaPoints += args.reward;
                safaribot.sendHtmlMessage(id, "<b>" + args.name + ":</b> Wow, I didn't expect to lose! Good job, here's your reward!", safchan);
                safaribot.sendMessage(id, "You received " + args.reward + " Silver Coin(s)!", safchan);
            } else {
                player.records.arenaLost += 1;
                safaribot.sendHtmlMessage(id, "<b>" + args.name + ":</b> Haha, seems like I won this time! Try harder next time!", safchan);
            }
            player.quests.arena.cooldown = now() + args.cooldown * 60 * 60 * 1000;
            safari.saveGame(player);
        };
        var opponents = {
            pink: {
                name: "Trainer Pink",
                party: ["36",80,222,700,594,706,65838,472,205,423,308,620,368,429,510,151],
                power: [60, 130],
                postBattle: postBattle,
                postArgs: {
                    reward: 1,
                    cooldown: 1
                }
            },
            teal: {
                name: "Trainer Teal",
                party: [282,330,248,"178",186,598,652,437,623,475,65790,384,272,550,66086],
                power: [90, 170],
                postBattle: postBattle,
                postArgs: {
                    reward: 2,
                    cooldown: 1.75
                }
            },
            mustard: {
                name: "Trainer Mustard",
                party: [65,131743,38,203,"26",560,297,563,145,71,479,65964,15,28,135],
                power: [110, 200],
                postBattle: postBattle,
                postArgs: {
                    reward: 3,
                    cooldown: 2.5
                }
            },
            cyan: {
                name: "Trainer Cyan",
                party: [448,202,539,476,635,593,376,"171",65959,445,66091,214,378,658,465],
                power: [150, 300],
                postBattle: postBattle,
                postArgs: {
                    reward: 6,
                    cooldown: 3.25
                }
            },
            crimson: {
                name: "Trainer Crimson",
                party: [131078,101,625,"663",212,342,47,553,538,721,149,45,197087,168,571,213],
                power: [200, 380],
                postBattle: postBattle,
                postArgs: {
                    reward: 10,
                    cooldown: 4
                }
            }
        };
        var price = {
            pink: 100,
            teal: 200,
            mustard: 300,
            cyan: 500,
            crimson: 1000
        };

        var opt = data[0].toLowerCase();
        if (opt === "help") {
            sys.sendMessage(src, "", safchan);
            safaribot.sendHtmlMessage(src, "Arena Clerk: Challenge our trainers for a chance to receive some Silver Coins! The trainers available are: ", safchan);
            for (var n in opponents) {
                var opp = opponents[n];
                safaribot.sendHtmlMessage(src, "-<b>" + cap(n) + "</b>: Entry Fee: $" + addComma(price[n])  + ". Reward: " + opp.postArgs.reward + " Silver Coin" + (opp.postArgs.reward === 1 ? "" : "s") + ". Cooldown: " + utilities.getTimeString(opp.postArgs.cooldown * 60 * 60) + ". ", safchan);
            }
            sys.sendMessage(src, "", safchan);
            safaribot.sendMessage(src, "Arena Clerk: Once you decide on your challenge, type /quest arena:[name] (e.g.: /quest arena:yellow).", safchan);
            sys.sendMessage(src, "", safchan);
            return;
        }
        if (this.isBattling(sys.name(src))) {
            safaribot.sendMessage(src, "You are already in a battle!", safchan);
            return;
        }
        if (contestCooldown <= 35 || contestCount > 0) {
            safaribot.sendMessage(src, "You cannot battle during a contest or when one is about to start!", safchan);
            return;
        }
        if (currentPokemon) {
            safaribot.sendMessage(src, "You cannot start a battle while a wild Pokémon is around!", safchan);
            return;
        }
        if (player.quests.arena.cooldown >= now()) {
            safaribot.sendMessage(src, "Arena Clerk: There's a long queue of people fighting in the Arena! Please come after " + timeLeftString(player.quests.arena.cooldown) + " to try another challenge!", safchan);
            return;
        }

        var npc = opponents[opt];
        if (!npc) {
            safaribot.sendMessage(src, "There's no one with that name around here!", safchan);
            return;
        }

        var cost = price[opt];
        if (player.money < cost) {
            safaribot.sendMessage(src, "You need to pay $" + addComma(cost) + " for this challenge, but you only have $" + addComma(player.money) + "!", safchan);
            return;
        }

        if (player.party.length < 6) {
            safaribot.sendMessage(src, "Your party must have 6 Pokémon for this challenge!", safchan);
            return;
        }
        npc.postArgs.name = npc.name;
        player.money -= cost;
        this.saveGame(player);

        sys.sendMessage(src, "", safchan);
        safaribot.sendMessage(src, "Arena Clerk: I see you paid the $" + addComma(cost) + " Entry Fee, so you can now proceed to your challenge against " + npc.name + "!", safchan);
        var battle = new Battle(src, npc);
        currentBattles.push(battle);
    };
    this.wonderTrade = function(src, data) {
        var player = getAvatar(src);
        var quest = player.quests.wonder;

        if (!data[0]) {
            sys.sendMessage(src, "", safchan);
            safaribot.sendMessage(src, "Wonder Trade Operator: Welcome to Wonder Trade, a place where you can trade a Pokémon you own for a random one!", safchan);
            safaribot.sendMessage(src, "Wonder Trade Operator: Use /quest wonder:[Pokémon] to choose a Pokémon to trade. If you wish to know how our system works, type /quest wonder:help!", safchan);
            sys.sendMessage(src, "", safchan);
            return;
        }

        var opt = data[0].toLowerCase();
        if (opt == "help") {
            sys.sendMessage(src, "", safchan);
            safaribot.sendMessage(src, "Wonder Trade Operator: To get a trade here you simply choose one of your Pokémon, pay a small fee and then you will receive a random Pokémon immediately!", safchan);
            safaribot.sendMessage(src, "Wonder Trade Operator: The fee is based on your Pokémon's BST, and you will receive a Pokémon within the same BST range.", safchan);
            safaribot.sendHtmlMessage(src, "Wonder Trade Operator: The available BST ranges are <a href='po:send//find bst 180 249'>180~249</a> ($50 fee), <a href='po:send//find bst 250 319'>250~319</a> ($100), <a href='po:send//find bst 320 389'>320~389</a> ($150), <a href='po:send//find bst 390 459'>390~459</a> ($300), <a href='po:send//find bst 460 529'>460~529</a> ($500) and <a href='po:send//find bst 530 599'>530~599</a> ($750).", safchan);
            safaribot.sendMessage(src, "Wonder Trade Operator: Also be aware that you CANNOT receive legendaries from Wonder Trade!", safchan);
            sys.sendMessage(src, "", safchan);
            return;
        }

        if (quest.cooldown > now()) {
            safaribot.sendMessage(src, "Wonder Trade Operator: Due to the rules imposed by the Pokémon Association, we cannot allow another trade in less than " + timeLeftString(quest.cooldown) + "!", safchan);
            return;
        }
        if (player.records.pokesCaught < 4) {
            safaribot.sendMessage(src, "You can only trade after you catch " + (4 - player.records.pokesCaught) + " more Pokémon!", safchan);
            return;
        }
        if (data.length < 1) {
            safaribot.sendMessage(src, "Wonder Trade Operator: Please use /quest wonder:[Pokémon] to choose the Pokémon you wish to trade. You can also type /quest wonder:help for more information.", safchan);
            return;
        }

        var input = getInputPokemon(data[0]);
        if (!input.num) {
            safaribot.sendMessage(src, "Wonder Trade Operator: That's not a valid Pokémon!", safchan);
            return;
        }

        var id = input.id;
        var bst = getBST(id);

        if (bst >= 600) {
            safaribot.sendMessage(src, "Wonder Trade Operator: I'm terribly sorry, but we don't accept Pokémon with a BST of 600 or more in the Wonder Trade!", safchan);
            return;
        }
        if (isMega(id)) {
            safaribot.sendMessage(src, "Wonder Trade Operator: I'm terribly sorry, but we don't accept Mega Pokémon in the Wonder Trade!", safchan);
            return;
        }
        if (!player.pokemon.contains(id)) {
            safaribot.sendMessage(src, "Wonder Trade Operator: You don't have a " + sys.pokemon(id) + "!", safchan);
            return;
        }

        var rangeIndex = Math.floor((bst - 180)/70);
        var bstRange = [[180,249], [250,319], [320,389], [390,459], [460,529], [530,599]][rangeIndex];
        var fee = [50, 100, 150, 300, 500, 750][rangeIndex];
        var cooldown = [0.5, 0.75, 1, 1.33, 1.66, 2][rangeIndex];

        if (data.length < 2 || data[1].toLowerCase() !== "confirm") {
            sys.sendMessage(src, "", safchan);
            safaribot.sendMessage(src, "Wonder Trade Operator: " + input.name + "'s BST is in the " + bstRange.join("~") + " range, so your fee will be $" + addComma(fee) + "!", safchan);
            safaribot.sendMessage(src, "Wonder Trade Operator: If you are sure you want to proceed, type /quest wonder:" + input.input + ":confirm and you will receive a Pokémon in the same range!", safchan);
            sys.sendMessage(src, "", safchan);
            return;
        }

        if (contestCount > 0) {
            safaribot.sendMessage(src, "You can't finish this quest during a contest.", safchan);
            return;
        }
        if (currentPokemon) {
            safaribot.sendMessage(src, "You can't finish this quest while there's a wild Pokémon around.", safchan);
            return;
        }
        if (player.money < fee) {
            safaribot.sendMessage(src, "Wonder Trade Operator: You don't have $" + addComma(fee) + "!", safchan);
            return;
        }
        if (!canLosePokemon(src, input.input + "", "trade")) {
            return;
        }
        sys.sendMessage(src, "", safchan);
        safaribot.sendMessage(src, "Wonder Trade Operator: So you want to try the Wonder Trade? Please give me the $" + addComma(fee) + " and your " + input.name + "!", safchan);

        var receivedId, receivedBST, isShiny = sys.rand(0, shinyChance) < (input.shiny ? 16 : 1);
        do {
            receivedId = sys.rand(1, 722);
            receivedBST = getBST(receivedId);
        } while (receivedBST < bstRange[0] || receivedBST > bstRange[1] || isLegendary(receivedId) || receivedId == input.num);
        receivedId = isShiny ? receivedId + "" : receivedId;

        safaribot.sendMessage(src, "Wonder Trade Operator: Please wait a moment while we process the trade...", safchan);
        this.removePokemon(src, id);
        player.pokemon.push(receivedId);
        player.money -= fee;

        quest.cooldown = now() + cooldown * 60 * 60 * 1000;
        this.saveGame(player);
        safaribot.sendMessage(src, "Wonder Trade Operator: The trade was finished successfully! You traded your " + input.name + " and received a " + poke(receivedId) + "!", safchan);
        sys.sendMessage(src, "", safchan);
        this.logLostCommand(sys.name(src), "quest wonder:" + data.join(":"), "received " + poke(receivedId));
    };

    this.sellPokemon = function(src, data) {
        var verb = "sell";
        if (!canLosePokemon(src, data, verb)) {
            return;
        }
        if (data === "*") {
            safaribot.sendMessage(src, "To sell a Pokémon, use /sell [name] to check its price, and /sell [name]:confirm to sell it.", safchan);
            return;
        }
        if (this.isInAuction(sys.name(src))) {
            safaribot.sendMessage(src, "You can't sell a Pokémon while participating in an auction!", safchan);
            return;
        }
        var player = getAvatar(src);
        var input = data.split(":");
        var info = getInputPokemon(input[0].replace(/flabebe/gi, "flabébé"));
        var shiny = info.shiny;
        var id = info.id;

        var perkBonus = 1 + Math.min(itemData.amulet.bonusRate * player.balls.amulet, itemData.amulet.maxRate);
        var price = getPrice(info.num, info.shiny, perkBonus);

        if (input.length < 2 || input[1].toLowerCase() !== "confirm") {
            var confirmCommand = "/sell " + (shiny ? "*":"") + sys.pokemon(id) + ":confirm";
            safaribot.sendHtmlMessage(src, "You can sell your " + info.name + " for $" + addComma(price) + ". To confirm it, type <a href=\"po:send/" + confirmCommand + "\">" + confirmCommand + "</a>.", safchan);
            return;
        }

        player.money += price;
        player.records.pokeSoldEarnings += price;
        this.removePokemon(src, id);

        safaribot.sendMessage(src, "You sold your " + info.name + " for $" + addComma(price) + "! You now have $" + addComma(player.money) + ".", safchan);
        this.logLostCommand(sys.name(src), "sell " + data);
        this.saveGame(player);
    };
    this.showPrices = function(src, shop, command, seller) {
        var i, info, input, price, player = getAvatar(src), pokemon = [], items = [], silverPokemon = [], silverItems = [];
        var fullCommand = "/" + command + " " + (seller ? seller + ":" : "");
        for (i in shop) {
            info = shop[i];
            input = getInputPokemon(i);
            if (info.silver) {
                if (input.num) {
                    silverPokemon.push("<a href=\"po:setmsg/" + fullCommand + input.name + ":1\">" + input.name + "</a>: " + addComma(info.price) + " Silver Coins" + (info.limit === -1 ? "" : (info.limit === 0 ? " (Out of stock)" : " (Only " + info.limit + " available)")));
                }
                else if (i[0] == "@") {
                    input = i.substr(1);
                    price = input == "box" ? itemData.box.price[Math.min(player.balls.box, itemData.box.price.length - 1)] : info.price;
                    silverItems.push("<a href=\"po:setmsg/" + fullCommand + input + ":1\">" + finishName(input) + "</a>: " + addComma(price) + " Silver Coins" + (info.limit === -1 ? "" : (info.limit === 0 ? " (Out of stock)" : " (Only " + info.limit + " available)")));
                }
            } else {
                if (input.num) {
                    pokemon.push("<a href=\"po:setmsg/" + fullCommand + input.name + ":1\">" + input.name + "</a>: $" + addComma(info.price) + (info.limit === -1 ? "" : (info.limit === 0 ? " (Out of stock)" : " (Only " + info.limit + " available)")));
                }
                else if (i[0] == "@") {
                    input = i.substr(1);
                    price = input == "box" ? itemData.box.price[Math.min(player.balls.box, itemData.box.price.length - 1)] : info.price;
                    items.push("<a href=\"po:setmsg/" + fullCommand + input + ":1\">" + finishName(input) + "</a>: $" + addComma(price) + (info.limit === -1 ? "" : (info.limit === 0 ? " (Out of stock)" : " (Only " + info.limit + " available)")));
                }
            }
        }
        sys.sendMessage(src, "", safchan);

        var hasNormal = false;
        var hasSilver = false;

        if (items.length > 0) {
            safaribot.sendMessage(src, "You can buy the following Items" + (seller ? " from " + seller : "") + ":", safchan);
            for (i in items) {
                safaribot.sendHtmlMessage(src, items[i], safchan);
            }
            hasNormal = true;
        }
        if (pokemon.length > 0) {
            if (items.length > 0) {
                sys.sendMessage(src, "", safchan);
            }
            safaribot.sendMessage(src, "You can buy the following Pokémon" + (seller ? " from " + seller : "") + ":", safchan);
            for (i in pokemon) {
                safaribot.sendHtmlMessage(src, pokemon[i], safchan);
            }
            hasNormal = true;
        }
        if (silverItems.length > 0) {
            if (pokemon.length > 0 || items.length > 0) {
                sys.sendMessage(src, "", safchan);
            }
            safaribot.sendMessage(src, "You can buy the following Items with Silver Coins" + (seller ? " from " + seller : "") + ":", safchan);
            for (i in silverItems) {
                safaribot.sendHtmlMessage(src, silverItems[i], safchan);
            }
            hasSilver = true;
        }
        if (silverPokemon.length > 0) {
            if (pokemon.length > 0 || items.length > 0 || silverItems.length > 0) {
                sys.sendMessage(src, "", safchan);
            }
            safaribot.sendMessage(src, "You can buy the following Pokémon with Silver Coins" + (seller ? " from " + seller : "") + ":", safchan);
            for (i in silverPokemon) {
                safaribot.sendHtmlMessage(src, silverPokemon[i], safchan);
            }
            hasSilver = true;
        }
        sys.sendMessage(src, "", safchan);
        if (hasNormal) {
            safaribot.sendMessage(src, "You currently have $" + addComma(player.money) + ". To buy something, use " + fullCommand + "[Pokémon/Item] (e.g.: " + fullCommand + "Pikachu or " + fullCommand + "Heavy Ball)", safchan);
        }
        if (hasSilver) {
            safaribot.sendMessage(src, "You currently have " + addComma(player.balls.silver) + " Silver Coin(s). To buy something, use " + fullCommand + "[Pokémon/Item] (e.g.: " + fullCommand + "Pikachu or " + fullCommand + "Heavy Ball)", safchan);
        }
    };
    this.getProduct = function(data) {
        var input = getInputPokemon(data);
        if (!input.num) {
            if (data[0] == "@") {
                data = data.substr(1);
            }
            data = itemAlias(data, true);
            if (currentItems.indexOf(data) !== -1) {
                return {
                    name: finishName(data),
                    input: "@" + data,
                    id: data,
                    type: "item"
                };
            }
        } else {
            input.type = "poke";
            return input;
        }
        return null;
    };
    this.isBelowCap = function(src, product, amount, type) {
        var player = getAvatar(src);
        if (type == "poke" && player.pokemon.length >= player.balls.box * itemData.box.bonusRate) {
            safaribot.sendMessage(src, "All your boxes are full! Please buy a new box with /buy before buying any Pokémon.", safchan);
            return false;
        }
        if (type == "item") {
            var cap = itemCap;
            if (product === "stick" || product == "master") {
                cap = 1;
            }
            if (player.balls[product] + amount > cap) {
                if (amount == cap) {
                    safaribot.sendMessage(src, "You are carrying the maximum amount of " + finishName(product) + " (" + cap + ") and cannot buy any more!", safchan);
                } else {
                    safaribot.sendMessage(src, "You can only carry " + cap + " " + finishName(product) + "! You currently have " + player.balls[product] + " which leaves space for " + (cap - player.balls[product]) + " more.", safchan);
                }
                return false;
            }
        }
        return true;
    };
    this.buyBonus = function(src, product, amount, cap) {
        var bonus, player = getAvatar(src);
        if (amount >= 10) {
            var bonusAmt = Math.floor(amount / 10);
            if (isBall(product)) {
                bonus = "premier";
                safaribot.sendMessage(src, "Here, take these " + bonusAmt + " Premier Balls for your patronage!", safchan);
            } else if (product === "gacha") {
                bonus = "gacha";
                bonusAmt *= 2;
                safaribot.sendMessage(src, "Here, take these " + bonusAmt + " extra Gachapon Tickets for your patronage!", safchan);
            }

            if (player.balls[bonus] + bonusAmt > cap) {
                var check = cap - player.balls[bonus];
                if (check < 1) {
                    safaribot.sendMessage(src, "However, you didn't have any space left and were forced to discard " + (bonusAmt === 1 ? "it" : "them") + "!", safchan);
                } else {
                    safaribot.sendMessage(src, "However, you only had space for " + check + " and were forced to discard the rest!", safchan);
                }
                bonusAmt = check;
                if (bonusAmt < 0) {
                    bonusAmt = 0;
                }
            }
            player.balls[bonus] += bonusAmt;
        }
    };
    this.updateShop = function(name, item) {
        var player = getAvatarOff(name);
        var itemInput = "@" + item;
        if (player && itemInput in player.shop && player.shop[itemInput].limit > player.balls[item]) {
            player.shop[itemInput].limit = player.balls[item];
        }
    };
    this.buyFromShop = function(src, data, command, fromNPC) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        if (!fromNPC && player.tradeban > now()) {
            safaribot.sendMessage(src, "You are banned from buying from other players for " + timeLeftString(player.tradeban) + "!", safchan);
            return;
        }
        if (!fromNPC && player.records.pokesCaught < 4) {
            safaribot.sendMessage(src, "You can only enter this shop after you catch " + (4 - player.records.pokesCaught) + " more Pokémon!", safchan);
            return;
        }
        var info = data.split(":"),
            input,
            sellerName = info[0],
            sName,
            seller,
            sellerId,
            shop = npcShop,
            product = info.length > 1 && info[1] !== "" ? info[1].toLowerCase() : "*";

        if (!fromNPC) {
            sellerId = sys.id(sellerName);
            if (sellerId) {
                seller = getAvatar(sellerId);
                if (!seller) {
                    safaribot.sendMessage(src, "No such person! Use /" + command + " Name to see their shop!", safchan);
                    return;
                }
            } else {
                safaribot.sendMessage(src, "No such person! Use /" + command + " Name to see their shop!", safchan);
                return;
            }
        }
        if (seller) {
            shop = seller.shop;
            sName = "<b>" + sys.name(sellerId) + ":</b> ";
        }
        if (!shop || Object.keys(shop).length === 0) {
            if (fromNPC) {
                safaribot.sendMessage(src, "[Closed] This shop is closed for maintenance. Please come back later.", safchan);
            } else {
                safaribot.sendHtmlMessage(src, sName + "I have nothing to sell right now.", safchan);
            }
            return;
        }

        if (product === "*") {
            this.showPrices(src, shop, command, (sellerId ? sys.name(sellerId) : null));
            return;
        }
        if (this.isInAuction(sys.name(src))) {
            safaribot.sendMessage(src, "You can't buy from a shop while participating in an auction!", safchan);
            return;
        }
        if (!fromNPC && (sellerName.toLowerCase() == sys.name(src).toLowerCase() || sys.ip(sellerId) === sys.ip(src))) {
            safaribot.sendMessage(src, "You cannot buy things from your own Shop!", safchan);
            return;
        }
        if (contestCount > 0) {
            safaribot.sendMessage(src, "[Closed] Out catching Pokémon at the Contest. Come back after the Contest!", safchan);
            return;
        }
        if (currentPokemon) {
            safaribot.sendMessage(src, "You cannot buy things while there's a wild Pokémon around!", safchan);
            return;
        }

        input = this.getProduct(product);
        if (!input) {
            if (fromNPC) {
                safaribot.sendMessage(src, "What's that \"" + product +  "\" you are talking about? A new item? Some unknown Pokémon species?", safchan);
            } else {
                safaribot.sendHtmlMessage(src, sName + "I don't have anything called \"" + product +  "\" in my humble shop.", safchan);
            }
            return;
        }
        if (!(input.input in shop)) {
            if (fromNPC) {
                safaribot.sendMessage(src, "Sorry, we are not selling any " + input.name + " at the moment.", safchan);
            } else {
                safaribot.sendHtmlMessage(src, sName + "I'm not selling any " + input.name + " right now, please don't insist!", safchan);
            }
            return;
        }
        if (shop[input.input].limit === 0) {
            if (fromNPC) {
                safaribot.sendMessage(src, "Sorry, we already sold all " + input.name + " we had.", safchan);
            } else {
                safaribot.sendHtmlMessage(src, sName + "You are out of luck, I just sold my last " + input.name + " " + sys.rand(1, 10) + " seconds ago!", safchan);
            }
            return;
        }

        if (input.type == "poke" && !fromNPC && seller.party.length === 1 && seller.party[0] == input.id && countRepeated(seller.pokemon, input.id) <= 1) {
            safaribot.sendHtmlMessage(src, sName + "You are out of luck, I just sold my last " + input.name + " " + sys.rand(1, 10) + " seconds ago!", safchan);
            safaribot.sendMessage(sellerId, "You cannot sell the last Pokémon in your party! Removing them from your shop.", safchan);
            delete seller.shop[input.input];
            return;
        }

        var amount = 1;
        if (input.type == "item" && info.length > 2) {
            amount = parseInt(info[2], 10);
            if (isNaN(amount) || amount < 1 || input.id == "box") {
                amount = 1;
            }
        }

        if (shop[input.input].limit !== -1 && shop[input.input].limit - amount < 0) {
            if (fromNPC) {
                safaribot.sendMessage(src, "I'm sorry, but we currently only have " + (shop[input.input].limit) + " " + input.name + " to sell, so you can't buy " + amount + "!", safchan);
            } else {
                safaribot.sendHtmlMessage(src, sName + "I only have " + (shop[input.input].limit) + " " + input.name + " to sell, how do you expect me to sell you " + amount + "?", safchan);
            }
            return;
        }

        var cap = itemCap;
        if (input.id === "stick" || input.id === "master") {
            cap = 1;
        }
        if (!this.isBelowCap(src, input.id, amount, input.type)) {
            return;
        }

        var isSilver = shop[input.input].silver || false;

        var boxPrice = itemData.box.price[Math.min(player.balls.box, itemData.box.price.length - 1)];
        var cost = input.id == "box" ? boxPrice : shop[input.input].price * amount;

        if (isSilver) {
            if (player.balls.silver < cost) {
                if (fromNPC) {
                    safaribot.sendMessage(src, "You need " + addComma(cost) + " Silver Coin(s) to buy " + amount + " " + input.name + ", but you only have " + addComma(player.balls.silver) + " Silver Coin(s)!", safchan);
                } else {
                    safaribot.sendHtmlMessage(src, sName + "Ok, it will cost you " + addComma(cost) + " Silver Coin(s) to buy " + amount + " " + input.name + "... Hey! You only have " + addComma(player.balls.silver) + " Silver Coin(s), so no deal!", safchan);
                }
                return;
            }
            player.balls.silver -= cost;
        } else {
            if (player.money < cost) {
                if (fromNPC) {
                    safaribot.sendMessage(src, "You need $" + addComma(cost) + " to buy " + amount + " " + input.name + ", but you only have $" + addComma(player.money) + "!", safchan);
                } else {
                    safaribot.sendHtmlMessage(src, sName + "Ok, it will cost you $" + addComma(cost) + " to buy " + amount + " " + input.name + "... Hey! You only have $" + addComma(player.money) + ", so no deal!", safchan);
                }
                return;
            }
            player.money -= cost;
        }

        if (input.type == "poke") {
            player.pokemon.push(input.id);
        }
        else if (input.type == "item") {
            if (!fromNPC && input.id == "battery") {
                this.dailyReward(src, getDay(now()));
            }
            player.balls[input.id] += amount;
        }
        if (isSilver) {
            if (fromNPC) {
                safaribot.sendMessage(src, "You bought " + amount + " " + input.name + "(s) for " + addComma(cost) + " Silver Coin(s)! You now have " + addComma(player.balls.silver) + " Silver Coin(s)!", safchan);
            } else {
                safaribot.sendHtmlMessage(src, sName + "Here's your " + amount + " " + input.name + "(s) for mere " + addComma(cost) + " Silver Coin(s)! Thanks for your purchase, you now have " + addComma(player.balls.silver) + " Silver Coin(s)!", safchan);
            }
        } else {
            if (fromNPC) {
                safaribot.sendMessage(src, "You bought " + amount + " " + input.name + "(s) for $" + addComma(cost) + "! You now have $" + addComma(player.money) + "!", safchan);
            } else {
                safaribot.sendHtmlMessage(src, sName + "Here's your " + amount + " " + input.name + "(s) for mere $" + addComma(cost) + "! Thanks for your purchase, you now have $" + addComma(player.money) + "!", safchan);
            }
        }

        var limitChanged = false;
        if (shop[input.input].limit > 0) {
            shop[input.input].limit -= amount;
            limitChanged = true;
        }
        if (seller) {
            if (isSilver) {
                seller.balls.silver = Math.min(seller.balls.silver + cost, itemCap);
            } else {
                seller.money = Math.min(seller.money + cost, moneyCap);
            }
            if (input.type == "poke") {
                this.removePokemon(sellerId, input.id);
            } else if (input.type == "item") {
                if (input.id == "battery") {
                    this.dailyReward(sellerId, getDay(now()));
                }
                seller.balls[input.id] -= amount;
                this.updateShop(sellerName, input.id);
            }
            sys.sendMessage(sellerId, "", safchan);
            if (isSilver) {
                safaribot.sendMessage(sellerId, "Someone bought " + amount + " of your " + input.name + "! You received " + addComma(cost) + " Silver Coin(s) and now have " + addComma(seller.balls.silver) + " Silver Coin(s)!", safchan);
            } else {
                safaribot.sendMessage(sellerId, "Someone bought " + amount + " of your " + input.name + "! You received $" + addComma(cost) + " and now have $" + addComma(seller.money) + "!", safchan);
            }
            sys.sendMessage(sellerId, "", safchan);
            this.saveGame(seller);
            sys.appendToFile(shopLog, now() + "|||" + sys.name(sellerId) + "::" + amount + "::" + input.name + "::" + shop[input.input].price + "::" + cost + ":::" + isSilver + "|||" + sys.name(src) + "\n");
        } else {
            if (!isSilver) {
                this.buyBonus(src, input.id, amount, cap);
            }
            if (limitChanged) {
                this.saveShop();
            }
        }
        this.saveGame(player);
    };
    this.editShop = function(src, data, editNPCShop, isSilver) {
        var player = getAvatar(src);
        if (!editNPCShop) {
            if (!validPlayers("self", src)) {
                return;
            }
            if (player.tradeban > now()) {
                safaribot.sendMessage(src, "You are banned from creating your own shop for " + timeLeftString(player.tradeban) + "!", safchan);
                return;
            }
            if (player.records.pokesCaught < 4) {
                safaribot.sendMessage(src, "You can only set a shop after you catch " + (4 - player.records.pokesCaught) + " more Pokémon!", safchan);
                return;
            }
            if (this.isInAuction(sys.name(src))) {
                safaribot.sendMessage(src, "You can't modify your shop while participating in an auction!", safchan);
                return;
            }
        }
        var comm = editNPCShop ? "npc" : "shop";

        var info = data.split(":");
        if (info.length < 2) {
            safaribot.sendMessage(src, "Invalid format! Use /"+comm+"add [pokémon/item]:[price]:[amount] or /"+comm+"remove [pokémon/item].", safchan);
            return true;
        }
        var action = info[0];
        var productType = "poke";
        var product = info[1];
        var input = getInputPokemon(product);

        if ((action !== "close" || action !== "clean") && !input.num) {
            if (product[0] == "@") {
                product = product.substr(1);
            }
            product = itemAlias(product);
            if (currentItems.indexOf(product) === -1) {
                safaribot.sendMessage(src, "Invalid format! Use /"+comm+"add [pokémon/item]:[price]:[limit] or /"+comm+"remove [pokémon/item]. You can clear your shop with /"+comm+"close or /"+comm+"clean.", safchan);
                return true;
            }
            productType = "item";
            input = {
                input: "@" + product,
                name: finishName(product)
            };
        }

        if (action == "add") {
            if (info.length < 2) {
                safaribot.sendMessage(src, "Invalid format! Use /"+comm+"add [pokémon/item]:[price]:[limit] or /"+comm+"remove [pokémon/item]. You can clear your shop with /"+comm+"close or /"+comm+"clean.", safchan);
                return true;
            }
            var limit = info.length > 3 ? parseInt(info[3], 10) : -1;
            limit = isNaN(limit) ? -1 : limit;
            if (limit < 1 && !editNPCShop) {
                limit = 1;
            }

            if (!editNPCShop) {
                if (productType == "poke") {
                    if (!canLosePokemon(src, input.input, "sell")) {
                        return true;
                    }
                    if (input.id == player.starter) {
                        safaribot.sendMessage(src, "You cannot add your starter Pokémon to your shop!", safchan);
                        return true;
                    }
                    if (limit > countRepeated(player.pokemon, input.id)) {
                        safaribot.sendMessage(src, "You do not have " + limit + " " + input.name + " to add to your shop!", safchan);
                        return true;
                    }
                }
                else if (productType == "item") {
                    if (!itemData[product].tradable) {
                        safaribot.sendMessage(src, "This item cannot be added to your shop!", safchan);
                        return true;
                    }
                    if (player.balls[product] < limit) {
                        safaribot.sendMessage(src, "You do not have " + limit + " " + input.name + " to add to your shop!", safchan);
                        return true;
                    }
                    if ("tradeReq" in itemData[product] && player.balls[product] - limit < itemData[product].tradeReq) {
                        safaribot.sendMessage(src, "This item cannot be added to your shop unless you have at least " + itemData[product].tradeReq + " of those!", safchan);
                        return true;
                    }
                }
                if (Object.keys(player.shop).length >= 22) {
                    safaribot.sendMessage(src, "Your shop is too large! Please remove something before adding a new item!", safchan);
                    return true;
                }
            }
            var price = parseInt(info[2], 10);
            if (isNaN(price) || price < 1 || price > moneyCap) {
                safaribot.sendMessage(src, "Please type a valid price!", safchan);
                return true;
            }
            if (!editNPCShop && productType == "poke") {
                var minPrice = getPrice(input.id, input.shiny);
                if (price < minPrice) {
                    safaribot.sendMessage(src, "You cannot sell " + input.name + " for less than $" + addComma(minPrice) + "!", safchan);
                    return true;
                }
            }

            safaribot.sendMessage(src, input.name + " has been " + (input.input in player.shop ? "re" : "") + "added to " + (editNPCShop ? "the NPC Shop" : "your") + " shop with the price of " + (isSilver ? "" : "$") + addComma(price) + (isSilver ? " Silver Coin(s)" : "") + " (Units Available: " + (limit == -1 ? "Unlimited" : limit) + ")!", safchan);
            if (editNPCShop) {
                npcShop[input.input] = { price: price, limit: limit, silver: isSilver };
                this.saveShop();
            } else {
                player.shop[input.input] = { price: price, limit: limit };
                this.saveGame(player);
            }
        }
        else if (action == "remove") {
            if (editNPCShop) {
                if (input.input in npcShop) {
                    delete npcShop[input.input];
                    safaribot.sendMessage(src, input.name + " has been removed from the NPC shop!", safchan);
                    this.saveShop();
                } else {
                    safaribot.sendMessage(src, "You can't remove a Pokémon/Item from the shop if they are not there!", safchan);
                }
            } else {
                if (input.input in player.shop) {
                    delete player.shop[input.input];
                    safaribot.sendMessage(src, input.name + " has been removed from your shop!", safchan);
                    this.saveGame(player);
                } else {
                    safaribot.sendMessage(src, "You can't remove a Pokémon/Item from the shop if they are not there!", safchan);
                }
            }
        }
        else if (action == "close") {
            if (editNPCShop) {
                for (var e in npcShop) {
                    delete npcShop[e];
                }
                safaribot.sendMessage(src, "The NPC Shop has been cleared!", safchan);
                this.saveShop();
            } else {
                for (var e in player.shop) {
                    delete player.shop[e];
                }
                safaribot.sendMessage(src, "Removed all Pokémon/Items from your shop!", safchan);
                this.saveGame(player);
            }
        }
        else if (action == "clean") {
            if (editNPCShop) {
                for (var e in npcShop) {
                    if (npcShop[e].limit === 0) {
                        delete npcShop[e];
                    }
                }
                safaribot.sendMessage(src, "The NPC Shop has been cleaned!", safchan);
                this.saveShop();
            } else {
                for (var e in player.shop) {
                    if (player.shop[e].limit === 0) {
                        delete player.shop[e];
                    }
                }
                safaribot.sendMessage(src, "Removed all Out of Stock Pokémon/Items from your shop!", safchan);
                this.saveGame(player);
            }
        }
        else {
            safaribot.sendMessage(src, "Invalid format! Use /"+comm+"add [pokémon/item]:[price]:[limit] or /"+comm+"remove [pokémon/item]. You can clear your shop with /"+comm+"close or /"+comm+"clean.", safchan);
        }
        return true;
    };
    this.buyCostumes = function (src/*, data*/) {
        if (!validPlayers("self", src)) {
            return;
        }
        //var player = getAvatar(src);
        //var validItems = allCostumes;

        //Temporarily block costume purchasing till we rework based on suggestions
        safaribot.sendMessage(src, "[Closed] Under renovation.", safchan);
        return;

        /*if (data === "*") {
            safaribot.sendMessage(src, "You can buy the following costumes:", safchan);
            var costumeName;
            for (var i = 0; i < validItems.length; i++) {
                costumeName = validItems[i];
                safaribot.sendHtmlMessage(src, "<a href='po:setmsg//buycostume " + costumeData[costumeName].name +"'>" + costumeData[costumeName].fullName + "</a>: $" + addComma(costumeData[costumeName].price || defaultCostumePrice), safchan);
            }
            sys.sendMessage(src, "", safchan);
            safaribot.sendMessage(src, "You currently have $" + addComma(player.money) + ". To buy a costume, use /buycostume <costume name> or carefully click the costume name and press enter!", safchan);
            return;
        }
        if (contestCount > 0) {
            safaribot.sendMessage(src, "[Closed] Out catching Pokémon at the Contest. Come back after the Contest!", safchan);
            return;
        }
        var costume = costumeAlias(data, true);
        if (validItems.indexOf(costume) == -1) {
            safaribot.sendMessage(src, "We don't seem to sell \"" + costume +  "\" at this location.", safchan);
            return;
        }

        var costumeName = costumeAlias(data, false, true);
        if (player.costumes[costume] >= 1) {
            safaribot.sendMessage(src, "You already own " + costumeName + "!", safchan);
            return;
        }
        var cost = (costumeData[costume].price || defaultCostumePrice);
        if (isNaN(player.money)) {
            player.money = 0;
        }
        if (player.money < cost) {
            safaribot.sendMessage(src, "You need $" + addComma(cost) + " to buy the " + costumeName  + " costume, but you only have $" + addComma(player.money) + "!", safchan);
            return;
        }
        player.money -= cost;
        player.costumes[costume] = 1;
        safaribot.sendMessage(src, "You bought the " + costumeName +  " for $" + addComma(cost) + "! You have $" + addComma(player.money) + " left!", safchan);
        this.saveGame(player);
        */
    };
    this.sellItems = function(src, data) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        var validItems = [];
        for (var e in itemData) {
            if (itemData[e].type === "valuables" && itemData[e].price > 0) {
                validItems.push(itemData[e].name);
            }
        }

        var perkBonus = 1 + Math.min(itemData.crown.bonusRate * player.balls.crown, itemData.crown.maxRate);
        if (data === "*") {
            safaribot.sendMessage(src, "You can sell the following items:", safchan);
            for (var i = 0; i < validItems.length; i++) {
                safaribot.sendMessage(src, itemData[validItems[i]].fullName + ": $" + addComma(Math.floor(itemData[validItems[i]].price/2 * perkBonus)), safchan);
            }
            sys.sendMessage(src, "", safchan);
            var valuables = [];
            for (var i = 0; i < validItems.length; i++) {
                var misc = validItems[i];
                var amt = player.balls[misc];
                if (amt > 0) {
                    var plural = amt > 1 ? "s" : "";
                    valuables.push(amt + " " + finishName(misc) + plural);
                }
            }
            if (valuables.length > 0) {
                safaribot.sendMessage(src, "You currently have " + readable(valuables, "and") + ". To sell an item, use /pawn item:quantity (e.g.: /pawn pearl:3).", safchan);
            } else {
                safaribot.sendMessage(src, "You don't have anything that can be sold at this time!", safchan);
            }
            return;
        }
        if (contestCount > 0) {
            safaribot.sendMessage(src, "[Closed] Out catching Pokémon at the Contest. Come back after the Contest!", safchan);
            return;
        }
        if (this.isInAuction(sys.name(src))) {
            safaribot.sendMessage(src, "You can't sell an item while participating in an auction!", safchan);
            return;
        }
        var info = data.split(":");
        var item = itemAlias(info[0], true);
        var amount = 1;
        if (info.length > 1) {
            amount = parseInt(info[1], 10);
            if (isNaN(amount) || amount < 1) {
                amount = 1;
            }
        }

        if (validItems.indexOf(item) == -1) {
            safaribot.sendMessage(src, "We do not buy \"" + info[0] +  "\" at this location.", safchan);
            return;
        }

        if (player.balls[item] < amount) {
            safaribot.sendMessage(src, "You don't have " + amount + " " + finishName(item) + ", you only have " + player.balls[item] + "!", safchan);
            return;
        }
        var cost = Math.floor(amount * itemData[item].price/2 * perkBonus);
        player.money += cost;
        player.balls[item] -= amount;
        player.records.pawnEarnings += cost;
        safaribot.sendMessage(src, "You sold " + amount + " " + finishName(item) +  " for $" + addComma(cost) + "! You now have " + player.balls[item] + " " + finishName(item) + " and $" + addComma(player.money) + "!", safchan);
        this.updateShop(sys.name(src), item);
        this.saveGame(player);
    };
    this.tradePokemon = function(src, data) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        if (player.tradeban > now()) {
            safaribot.sendMessage(src, "You are banned from trading for " + timeLeftString(player.tradeban) + "!", safchan);
            return;
        }
        if (player.records.pokesCaught < 4) {
            safaribot.sendMessage(src, "You can only trade after you catch " + (4 - player.records.pokesCaught) + " more Pokémon!", safchan);
            return;
        }
        var userName = sys.name(src).toLowerCase();
        if (data.toLowerCase() == "cancel" && userName in tradeRequests) {
            safaribot.sendMessage(src, "You cancelled your trade request with " + tradeRequests[userName].target + "!", safchan);
            delete tradeRequests[userName];
            return;
        }
        if (contestCount > 0) {
            safaribot.sendMessage(src, "You can't trade during a contest!", safchan);
            return;
        }
        if (currentPokemon) {
            safaribot.sendMessage(src, "You can't trade while there's a Wild Pokémon around!", safchan);
            return;
        }
        if (this.isBattling(sys.name(src))) {
            safaribot.sendMessage(src, "You can't trade during a battle!", safchan);
            return;
        }
        if (this.isInAuction(sys.name(src))) {
            safaribot.sendMessage(src, "You can't trade while participating in an auction!", safchan);
            return;
        }

        var info = data.split(":");
        if (info.length < 3) {
            safaribot.sendMessage(src, "To trade Pokémon with another player, use /trade [Player]:[Your Offer]:[What you want].", safchan);
            safaribot.sendMessage(src, "You can trade a Pokémon (type the name or number), money (type $150) or item (type @master).", safchan);
            return;
        }
        if (userName in tradeRequests) {
            safaribot.sendHtmlMessage(src, "You already have a pending trade! To cancel it, type '<a href='po:send//trade cancel'>/trade cancel</a>'.", safchan);
            return;
        }

        if (!validPlayers("target", src, info[0].toLowerCase())) {
            return;
        }
        var targetId = sys.id(info[0].toLowerCase());
        var target = getAvatar(targetId);
        if (target.tradeban > now()) {
            safaribot.sendMessage(src, "This person cannot receive trade requests right now!", safchan);
            return;
        }
        if (info[0].toLowerCase() == userName || sys.ip(targetId) === sys.ip(src)) {
            safaribot.sendMessage(src, "You cannot trade with yourself!", safchan);
            return;
        }

        var offer = info[1].replace(/flabebe/gi, "flabébé").toLowerCase();
        var request = info[2].replace(/flabebe/gi, "flabébé").toLowerCase();

        var offerType = this.isValidTrade(src, offer, "offer", request);
        if (!offerType) {
            return;
        }
        var requestType = this.isValidTrade(src, request, "request", offer);
        if (!requestType) {
            return;
        }
        if (offerType == "money" && requestType == "money") {
            safaribot.sendMessage(src, "You cannot trade money for money!", safchan);
            return;
        }
        if (!this.canTrade(src, offer)) {
            return;
        }

        var targetName = sys.name(targetId).toLowerCase();

        var offerName = this.translateTradeOffer(offer);
        var requestName = this.translateTradeOffer(request);
        var offerInput = this.tradeOfferInput(offer);
        var reqInput = this.tradeOfferInput(request);

        if (offerType == "item" && requestType == "item" && itemAlias(offerInput.substr(offerInput.indexOf("@") + 1), true) == itemAlias(reqInput.substr(reqInput.indexOf("@") + 1), true)) {
            safaribot.sendMessage(src, "You cannot trade an item for the same one!", safchan);
            return;
        }

        sys.sendMessage(src, "" , safchan);
        sys.sendMessage(targetId, "" , safchan);
        safaribot.sendMessage(src, "You are offering a " + offerName + " to " + sys.name(targetId) + " for their " + requestName+ "!" , safchan);
        safaribot.sendMessage(targetId, sys.name(src) + " is offering you a " + offerName + " for your " + requestName + "!" , safchan);

        if (targetName in tradeRequests && tradeRequests[targetName].target === userName) {
            var req = tradeRequests[targetName];
            if (offerInput == req.request && reqInput == req.offer) {
                if (!this.canTrade(targetId, request)) {
                    safaribot.sendMessage(src, "Trade cancelled because " + sys.name(targetId) + " couldn't fulfill their offer." , safchan);
                    safaribot.sendMessage(targetId, "Trade cancelled because you couldn't fulfill your offer." , safchan);
                    delete tradeRequests[targetName];
                    return;
                }
                if (!this.canReceiveTrade(src, targetId, offerInput, reqInput)) {
                    delete tradeRequests[targetName];
                    return;
                }
                if (!this.canReceiveTrade(targetId, src, reqInput, offerInput)) {
                    delete tradeRequests[targetName];
                    return;
                }
                var obj, val;
                switch (offerType) {
                    case "poke":
                        obj = getInputPokemon(offer);
                        this.removePokemon(src, obj.id);
                        target.pokemon.push(obj.id);
                    break;
                    case "money":
                        val = parseInt(offer.substr(1), 10);
                        player.money -= val;
                        target.money += val;
                    break;
                    case "item":
                        obj = itemAlias(offer.substr(offer.indexOf("@") + 1), true);
                        val = parseInt(offer.substr(0, offer.indexOf("@")), 10) || 1;

                        if (obj == "battery") {
                            this.dailyReward(src, getDay(now()));
                            this.dailyReward(targetId, getDay(now()));
                        }
                        player.balls[obj] -= val;
                        target.balls[obj] += val;
                        this.updateShop(sys.name(src), obj);
                    break;
                }

                switch (requestType) {
                    case "poke":
                        obj = getInputPokemon(request);
                        this.removePokemon(targetId, obj.id);
                        player.pokemon.push(obj.id);
                    break;
                    case "money":
                        val = parseInt(request.substr(1), 10);
                        player.money += val;
                        target.money -= val;
                    break;
                    case "item":
                        obj = itemAlias(request.substr(request.indexOf("@") + 1), true);
                        val = parseInt(request.substr(0, request.indexOf("@")), 10) || 1;
                        if (obj == "battery") {
                            this.dailyReward(src, getDay(now()));
                            this.dailyReward(targetId, getDay(now()));
                        }
                        player.balls[obj] += val;
                        target.balls[obj] -= val;
                        this.updateShop(sys.name(targetId), obj);
                    break;
                }

                this.saveGame(player);
                this.saveGame(target);

                safaribot.sendMessage(src, "You traded your " + offerName + " for " + sys.name(targetId) + "'s " + requestName + "!", safchan);
                safaribot.sendMessage(targetId, "You traded your " + requestName + " for " + sys.name(src) + "'s " + offerName + "!", safchan);
                sys.sendMessage(src, "" , safchan);
                sys.sendMessage(targetId, "" , safchan);
                delete tradeRequests[targetName];
                sys.appendToFile(tradeLog, now() + "|||" + sys.name(src) + "::" + offerName + "|||" + sys.name(targetId) + "::" + requestName + "\n");
            }
            else {
                var acceptCommand = "/trade " + sys.name(src) + ":" + reqInput + ":" + offerInput;
                safaribot.sendMessage(src, "You sent a counter-offer to " + sys.name(targetId) + "!" , safchan);
                safaribot.sendHtmlMessage(targetId, sys.name(src) + " sent you a counter-offer. To accept it, type <a href=\"po:setmsg/" + acceptCommand + "\">" + acceptCommand + "</a>.", safchan);
                sys.sendMessage(src, "" , safchan);
                sys.sendMessage(targetId, "" , safchan);
                delete tradeRequests[targetName];
                tradeRequests[userName] = { target: targetName, offer: offerInput, request: reqInput };
            }
        }
        else {
            var acceptCommand = "/trade " + sys.name(src) + ":" + reqInput + ":" + offerInput;
            safaribot.sendHtmlMessage(targetId, "To accept the trade, type <a href=\"po:setmsg/" + acceptCommand + "\">" + acceptCommand + "</a>.", safchan);
            sys.sendMessage(src, "" , safchan);
            sys.sendMessage(targetId, "" , safchan);
            tradeRequests[userName] = { target: targetName, offer: offerInput, request: reqInput };
        }
    };
    this.translateTradeOffer = function(asset) {
        if (asset[0] == "$") {
            return "$" + addComma(parseInt(asset.substr(asset.indexOf("$") + 1), 10));
        }
        else if (asset.indexOf("@") !== -1) {
            var item = itemAlias(asset.substr(asset.indexOf("@") + 1), true);
            var amount = parseInt(asset.substr(0, asset.indexOf("@")), 10) || 1;
            return amount + "x " + finishName(item);
        }
        else {
            return getInputPokemon(asset).name;
        }
    };
    this.tradeOfferInput = function(asset) {
        if (asset[0] == "$") {
            return "$" + parseInt(asset.substr(asset.indexOf("$") + 1), 10);
        }
        else if (asset.indexOf("@") !== -1) {
            var item = itemAlias(asset.substr(asset.indexOf("@") + 1), true);
            var amount = parseInt(asset.substr(0, asset.indexOf("@")), 10) || 1;
            return (amount > 1 ? amount : "") + "@" + item;
        }
        else {
            return getInputPokemon(asset).input;
        }
    };
    this.isValidTrade = function(src, asset, action, traded) {
        if (asset[0] == "$") {
            var val = parseInt(asset.substr(1), 10);
            if (isNaN(val) || val <= 0) {
                safaribot.sendMessage(src, "Please " + action + " a valid amount of money!", safchan);
                return false;
            }
            return "money";
        }
        else if (asset.indexOf("@") !== -1) {
            var item = itemAlias(asset.substr(asset.indexOf("@") + 1), true);
            var amount = parseInt(asset.substr(0, asset.indexOf("@")), 10) || 1;
            if (!(item in itemData)) {
                safaribot.sendMessage(src,  item + " is not a valid item!", safchan);
                return false;
            }
            if (!itemData[item].tradable) {
                safaribot.sendMessage(src,  finishName(item) + " cannot be traded!", safchan);
                return false;
            }
            if (isNaN(amount) || amount <= 0) {
                safaribot.sendMessage(src,  "Please " + action + " a valid amount of " + finishName(item) + "!", safchan);
                return false;
            }
            return "item";
        }
        else {
            var info = getInputPokemon(asset);
            if (!info.id) {
                safaribot.sendMessage(src, "Please " + action + " a valid pokémon!", safchan);
                return false;
            }
            if (sys.pokemon(info.id) == "Missingno") {
                safaribot.sendMessage(src, "Please " + action + " a valid pokémon!", safchan);
                return false;
            }
            if (traded[0] == "$") {
                var min = getPrice(info.id, info.shiny);
                var money = parseInt(traded.substr(1), 10);
                if (isNaN(money) || money < min) {
                    safaribot.sendMessage(src, info.name + " cannot be traded for less than $" + min + "!", safchan);
                    return false;
                }
            }
            return "poke";
        }
        return true;
    };
    this.canTrade = function(src, asset) {
        var player = getAvatar(src);
        if (asset[0] == "$") {
            var val = parseInt(asset.substr(1), 10);
            if (player.money < val) {
                safaribot.sendMessage(src, "You don't have enough $" + val + " to trade!", safchan);
                return false;
            }
        }
        else if (asset.indexOf("@") !== -1) {
            var item = itemAlias(asset.substr(asset.indexOf("@") + 1), true);
            var amount = parseInt(asset.substr(0, asset.indexOf("@")), 10) || 1;
            if (player.balls[item] < amount) {
                safaribot.sendMessage(src, "You don't have " + amount + " " + finishName(item) + "(s) to trade!", safchan);
                return false;
            }
            var data = itemData[item];
            if (data.tradeReq && player.balls[item] - amount < data.tradeReq) {
                safaribot.sendMessage(src, "You can't trade " + finishName(item) + " unless you have at least " + data.tradeReq + " of those!", safchan);
                return false;
            }
        }
        else {
            var info = getInputPokemon(asset);
            return canLosePokemon(src, info.input, "trade");
        }
        return true;
    };
    this.canReceiveTrade = function(src, receiverId, asset, offer) {
        var receiver = getAvatar(receiverId);
        if (asset[0] == "$") {
            var val = parseInt(asset.substr(1), 10);
            if (receiver.money + val > moneyCap) {
                safaribot.sendMessage(receiverId, "Trade cancelled because you can't hold more than $" + moneyCap + " (you currently have $" + receiver.money + ", so you can receive at most $" + (moneyCap - receiver.money) + ")!", safchan);
                safaribot.sendMessage(src, "Trade cancelled because " + sys.name(receiverId) + " can't hold more than $" + moneyCap + "!", safchan);
                return false;
            }
        }
        else if (asset.indexOf("@") !== -1) {
            var item = itemAlias(asset.substr(asset.indexOf("@") + 1), true);
            var amount = parseInt(asset.substr(0, asset.indexOf("@")), 10) || 1;

            if (receiver.balls[item] + amount > itemCap) {
                safaribot.sendMessage(src, "Trade cancelled because " + sys.name(receiverId) + " can't receive " + amount + " " + finishName(item) + "(s)!" , safchan);
                safaribot.sendMessage(receiverId, "Trade cancelled because you can't hold more than " + itemCap + " " + finishName(item) + "(s) (you currently have " + receiver.balls[item] + ", so you can receive at most " + (itemCap - amount) + ")!", safchan);
                return false;
            }
            if (item == "master" && receiver.balls[item] + amount > 1) {
                safaribot.sendMessage(src, "Trade cancelled because " + sys.name(receiverId) + " already has a Master Ball!" , safchan);
                safaribot.sendMessage(receiverId, "Trade cancelled because you already have a Master Ball!", safchan);
                return false;
            }
        }
        else {
            if (offer.indexOf("@") === -1 && offer[0] !== "$" && receiver.pokemon.length >= receiver.balls.box * itemData.box.bonusRate) {
                safaribot.sendMessage(src, "Trade cancelled because all of " + sys.name(receiverId) + "'s boxes are full!" , safchan);
                safaribot.sendMessage(receiverId, "Trade cancelled because all of your boxes are full!", safchan);
                return;
            }
        }
        return true;
    };
    this.createAuction = function(src, data) {
        if (!validPlayers("self", src, data)) {
            return;
        }
        var player = getAvatar(src);
        var info = data.split(":");

        if (info.length < 3) {
            safaribot.sendMessage(src, "To create an auction, type /auction product:startingOffer:minimumBid.", safchan);
            safaribot.sendMessage(src, "Example: /auction Bulbasaur:550:10 to auction a Bulbasaur, with offers starting at $550 and bids at least $10 higher than current offer.", safchan);
            if (player.cooldowns.auction > now()) {
                safaribot.sendMessage(src, "Please wait " + timeLeftString(player.cooldowns.auction) + " before starting a new auction!", safchan);
            }
            return;
        }
        if (player.tradeban > now()) {
            safaribot.sendMessage(src, "You are banned from starting auctions for " + timeLeftString(player.tradeban) + "!", safchan);
            return;
        }
        if (player.records.pokesCaught < 4) {
            safaribot.sendMessage(src, "You can only start an auction after you catch " + (4 - player.records.pokesCaught) + " more Pokémon!", safchan);
            return;
        }
        if (player.cooldowns.auction > now()) {
            safaribot.sendMessage(src, "Please wait " + timeLeftString(player.cooldowns.auction) + " before starting a new auction!", safchan);
            return;
        }
        if (this.isInAuction(sys.name(src))) {
            safaribot.sendMessage(src, "You are already participating in an auction!", safchan);
            return;
        }
        var product = info[0];
        var startingOffer = parseInt(info[1], 10);
        var minBid = parseInt(info[2], 10);

        var input = getInputPokemon(product);
        var type = "poke";
        if (!input.num) {
            if (product[0] == "@") {
                product = product.substr(1);
            }
            product = itemAlias(product, true);
            if (currentItems.indexOf(product) === -1) {
                safaribot.sendMessage(src, "Invalid format! Use /auction product:startingOffer:minimumBid.", safchan);
                return;
            }
            type = "item";
            input = {
                input: "@" + product,
                name: finishName(product)
            };
        }

        if (isNaN(startingOffer) || startingOffer < 1) {
            safaribot.sendMessage(src, "Please type a valid number for the starting offer!", safchan);
            return;
        }
        if (isNaN(minBid) || minBid < 1) {
            safaribot.sendMessage(src, "Please type a valid number for the minimum bid raise!", safchan);
            return;
        }
        if (type == "poke") {
            if (!player.pokemon.contains(input.id)) {
                safaribot.sendMessage(src, "You do not have a " + input.name + "!", safchan);
                return;
            }
            if (!canLosePokemon(src, input.input, "auction")) {
                return;
            }
            if (startingOffer < getPrice(input.id, input.shiny)) {
                safaribot.sendMessage(src, "Starting offer for " + input.name + " must be at least $" + addComma(getPrice(input.id, input.shiny)) + "!", safchan);
                return;
            }
        } else {
            if (!itemData[product].tradable) {
                safaribot.sendMessage(src, "You can't auction this item!", safchan);
                return true;
            }
            if (player.balls[product] < 1) {
                safaribot.sendMessage(src, "You do not have a " + input.name + "!", safchan);
                return;
            }
            if ("tradeReq" in itemData[product] && player.balls[product] - 1 < itemData[product].tradeReq) {
                safaribot.sendMessage(src, "This item cannot be auctioned unless you have at least " + itemData[product].tradeReq + " of those!", safchan);
                return true;
            }
        }
        if (minBid >= startingOffer / 2) {
            safaribot.sendMessage(src, "Minimum bid raise must be at most half the starting offer ($" + Math.floor(startingOffer/2) + ")!", safchan);
            return;
        }
        if (contestCooldown <= 200 || contestCount > 0) {
            safaribot.sendMessage(src, "You cannot create an auction during a contest or 3 minutes before a contest start!", safchan);
            return;
        }
        if (input.input in player.shop) {
            safaribot.sendMessage(src, "Please remove the " + input.name + " from your shop before auctioning it!", safchan);
            return;
        }

        var auction = new Auction(src, input.input, startingOffer, minBid);
        currentAuctions.push(auction);

        player.cooldowns.auction = now() + 15 * 60 * 1000;
        this.saveGame(player);
    };
    this.joinAuction = function(src, data) {
        if (!validPlayers("both", src, data)) {
            return;
        }
        var player = getAvatar(src);
        if (player.records.pokesCaught < 4) {
            safaribot.sendMessage(src, "You can only join an auction after you catch " + (4 - player.records.pokesCaught) + " more Pokémon!", safchan);
            return;
        }
        if (player.tradeban > now()) {
            safaribot.sendMessage(src, "You are banned from joining auctions for " + timeLeftString(player.tradeban) + "!", safchan);
            return;
        }
        var name = sys.name(src);
        var tName = sys.name(sys.id(data)).toLowerCase();

        if (this.isInAuction(name)) {
            safaribot.sendMessage(src, "You are already participating in an auction!", safchan);
            return;
        }

        var auction, b;
        for (b in currentAuctions) {
            auction = currentAuctions[b];
            if (auction.host == tName) {
                auction.join(src);
                return;
            }
        }

        safaribot.sendMessage(src, "This person is not hosting any auction!", safchan);
    };
    this.quitAuction = function(src, data) {
        if (!validPlayers("self", src, data)) {
            return;
        }
        var name = sys.name(src), auction, b;
        for (b in currentAuctions) {
            auction = currentAuctions[b];
            if (auction.isInAuction(name)) {
                auction.leave(src);
                return;
            }
        }

        safaribot.sendMessage(src, "You are not participating in any auction!", safchan);
    };
    this.bidAuction = function(src, data) {
        if (!validPlayers("self", src, data)) {
            return;
        }
        var name = sys.name(src), auction, b;
        for (b in currentAuctions) {
            auction = currentAuctions[b];
            if (auction.isInAuction(name)) {
                auction.makeOffer(src, data);
                return;
            }
        }

        safaribot.sendMessage(src, "You are not participating in any auction!", safchan);
    };

    this.viewOwnInfo = function(src, textOnly) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        var isAndroid = (sys.os(src) === "android");

        var out = "";

        //Current Party table
        out += this.showParty(src, true);

        //All owned Pokémon
        out += this.showBox(player, "all", isAndroid, textOnly);

        //Money/Balls table
        out += this.showBag(player, isAndroid, textOnly);

        //Costumes
        //out += this.showCostumes(player);

        sys.sendHtmlMessage(src, out, safchan);
    };
    this.viewPlayer = function(src, data) {
        var player = getAvatar(src);
        if (player) {
            switch (data.toLowerCase()) {
                case "on":
                    player.visible = true;
                    safaribot.sendMessage(src, "Now allowing other players to view your party!", safchan);
                    return;
                case "off":
                    player.visible = false;
                    safaribot.sendMessage(src, "Now disallowing other players from viewing your party!", safchan);
                    return;
            }
        }

        var id = sys.id(data);
        if (!id) {
            safaribot.sendMessage(src, "No such player!", safchan);
            return;
        }
        var target = getAvatar(id);
        if (!target) {
            safaribot.sendMessage(src, "This person didn't enter the Safari!", safchan);
            return;
        }

        if (target != player && target.visible === false && !SESSION.channels(safchan).isChannelAdmin(src)) {
            safaribot.sendMessage(src, "You cannot view this person's party!", safchan);
            return;
        }

        sys.sendHtmlMessage(src, this.showParty(id, false, src), safchan);
    };
    this.viewItems = function(src, textOnly) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        var isAndroid = (sys.os(src) === "android");
        sys.sendHtmlMessage(src, this.showBag(player, isAndroid, textOnly), safchan);
    };
    this.viewCostumes = function(src) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        sys.sendHtmlMessage(src, this.showCostumes(player), safchan);
    };
    this.viewBox = function(src, data, textOnly) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        var isAndroid = (sys.os(src) === "android");
        sys.sendHtmlMessage(src, this.showBox(player, (data === "*" ? 1 : data), isAndroid, textOnly), safchan);
    };
    this.manageParty = function(src, data) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        if (data === "*") {
            sys.sendHtmlMessage(src, this.showParty(src, true), safchan);
            safaribot.sendMessage(src, "To modify your party, type /add [pokémon] or /remove [pokémon]. Use /active [pokémon] to set your party leader. You can also manage saved parties with /party save:[slot] and /party load:[slot]. ", safchan);
            sys.sendMessage(src, "", safchan);
            return;
        }

        if (contestCount > 0) {
            safaribot.sendMessage(src, "You can't modify your party during a contest!", safchan);
            return;
        }
        if (currentPokemon) {
            safaribot.sendMessage(src, "You can't modify your party while a wild Pokémon is out!", safchan);
            return;
        }
        if (this.isBattling(sys.name(src))) {
            safaribot.sendMessage(src, "You can't modify your party during a battle!", safchan);
            return;
        }

        var input = data.split(":"), action, targetId;
        if (input.length < 2) {
            input = data.split(" ");
            if (input.length < 2) {
                sys.sendMessage(src, "", safchan);
                safaribot.sendMessage(src, "To modify your party, type /party add:[pokémon] or /party remove:[pokémon]. Use /party active:[pokémon] to set your party leader.", safchan);
                safaribot.sendMessage(src, "You can also manage saved parties with /party save:[slot] and /party load:[slot]. " + (player.savedParties.length > 0 ? "You have the following parties saved: " : ""), safchan);
                this.showSavedParties(src);
                sys.sendMessage(src, "", safchan);
                return;
            }
            action = input[0];
            targetId = input.slice(1).join(" ");
        } else {
            action = input[0].toLowerCase();
            targetId = input[1].toLowerCase();
        }

        var info, id;
        if (action !== "save" && action !== "load") {
            info = getInputPokemon(targetId);
            if (!info.num) {
                safaribot.sendMessage(src, "Invalid Pokémon!", safchan);
                return;
            }
            id = info.id;

            if (player.pokemon.indexOf(id) === -1) {
                safaribot.sendMessage(src, "You don't have that Pokémon!", safchan);
                return;
            }
        } else {
            targetId = parseInt(targetId, 10);
            targetId = isNaN(targetId) ? 0 : targetId;

            if (targetId === 0) {
                if (player.savedParties.length > 0) {
                    sys.sendMessage(src, "", safchan);
                    safaribot.sendMessage(src, "Your saved parties are:", safchan);
                    this.showSavedParties(src);
                    safaribot.sendMessage(src, "Use /party save:1 to save your current party to that slot, or /party load:2 to load that party.", safchan);
                    sys.sendMessage(src, "", safchan);
                } else {
                    safaribot.sendMessage(src, "You have no party saved! Use /party save:1 to save your current party to a slot.", safchan);
                }
                return;
            }
        }

        if (action === "add") {
            if (player.party.length >= 6) {
                safaribot.sendMessage(src, "Please remove a Pokémon from your party before adding another one!", safchan);
                return;
            }
            if (player.party.indexOf(id) !== -1 && countRepeated(player.party, id) >= countRepeated(player.pokemon, id)) {
                safaribot.sendMessage(src, "You don't have more of this pokémon to add to your party!", safchan);
                return;
            }

            player.party.push(id);
            safaribot.sendMessage(src, "You added " + info.name + " to your party!", safchan);
            this.saveGame(player);
        } else if (action === "remove") {
            if (player.party.indexOf(id) === -1) {
                safaribot.sendMessage(src, "This Pokémon is not in your party!", safchan);
                return;
            }
            if (player.party.length == 1) {
                safaribot.sendMessage(src, "You must have at least 1 Pokémon in your party!", safchan);
                return;
            }
            player.party.splice(player.party.indexOf(id), 1);
            safaribot.sendMessage(src, "You removed " + info.name + " from your party!", safchan);
            this.saveGame(player);
        } else if (action === "active") {
            if (player.party[0] === id) {
                safaribot.sendMessage(src, "This is already your active Pokémon!", safchan);
                return;
            }
            if (player.party.indexOf(id) === -1) {
                if (player.party.length >= 6) {
                    var removedId = player.party.splice(5, 1)[0];
                    safaribot.sendMessage(src, poke(removedId) + " was removed from your party!", safchan);
                }
            } else {
                player.party.splice(player.party.indexOf(id), 1);
            }

            player.party.splice(0, 0, id);
            safaribot.sendMessage(src, "You are now using " + info.name + " as your active Pokémon!", safchan);
            this.saveGame(player);
        } else if (action === "save") {
            var num = targetId - 1;
            if (num > 4) {
                num = 4;
            } else if (num < 0) {
                num = 0;
            }

            var toSave = player.party.concat();
            if (num >= player.savedParties.length) {
                player.savedParties.push(toSave);
                num = player.savedParties.length - 1;
            } else {
                player.savedParties[num] = toSave;
            }

            safaribot.sendMessage(src, "Saved your current party to slot " + (num + 1) + "!", safchan);
            this.saveGame(player);
        } else if (action === "load") {
            var num = targetId - 1;
            if (num < 0) {
                num = 0;
            }
            if (player.savedParties.length > 0 && num >= player.savedParties.length) {
                num = player.savedParties.length - 1;
            }

            if (num >= player.savedParties.length) {
                safaribot.sendMessage(src, "You have no party saved on that slot!", safchan);
                return;
            }

            var toLoad = player.savedParties[num];

            for (var p = toLoad.length - 1; p >= 0; p--) {
                id = toLoad[p];
                if (player.pokemon.indexOf(id) === -1) {
                    safaribot.sendMessage(src, "You no longer have a " + poke(id) + "!", safchan);
                    toLoad.splice(p, 1);
                    continue;
                }
                var c = countRepeated(toLoad, id);
                if (c > countRepeated(player.pokemon, id)) {
                    safaribot.sendMessage(src, "You no longer have " + c + " " + poke(id) + "(s)!", safchan);
                    toLoad.splice(p, 1);
                }
            }

            if (toLoad.length === 0) {
                safaribot.sendMessage(src, "Couldn't load from slot " + targetId + " because you no longer have any of those Pokémon!", safchan);
                return;
            }

            player.party = toLoad.concat();
            safaribot.sendMessage(src, "Loaded your party from slot " + (num + 1) + " (" + readable(player.party.map(poke), "and") + ")!", safchan);
            this.saveGame(player);
        } else {
            safaribot.sendMessage(src, "To modify your party, type /party add:[pokémon] or /party remove:[pokémon]. Use /party active:[pokémon] to set your party leader.", safchan);
        }
    };
    this.showSavedParties = function(src) {
        var player = getAvatar(src);
        for (var e = 0; e < player.savedParties.length; e++) {
            safaribot.sendMessage(src, (e + 1) + ". " + readable(player.savedParties[e].map(poke), "and"), safchan);
        }
    };
    this.showParty = function(id, ownParty, srcId) {
        var player = getAvatar(id),
            party = player.party.map(pokeInfo.sprite),
            costumed = (player.costume !== "none");
        var out = "<table border = 1 cellpadding = 3><tr><th colspan=" + (party.length + (costumed ? 1 : 0)) + ">" + (ownParty ? "Current" : sys.name(id) + "'s" ) + " Party</th></tr><tr>";
        if (!ownParty) {
            id = srcId || id;
        }
        var isAndroid = (sys.os(id) === "android");
        if (isAndroid) {
            out += "<br />";
        }
        if (costumed) {
            out += "<td>" + costumeSprite(player.costume, isAndroid) + "</td>";
        }
        for (var e in party) {
            out += "<td align=center>" + party[e] + "</td>";
        }
        out += "</tr><tr>";
        if (costumed) {
            out += "<td align=center>" + costumeAlias(player.costume, false, true) + "</td>";
        }
        for (var e in player.party) {
            var member = getPokemonInfo(player.party[e]);
            var name = sys.pokemon(member[0]) + (member[1] === true ? "*" : "");
            out += "<td align=center>#" + pokeInfo.readableNum(member[0]) + " " + name;
            if (ownParty && sys.os(id) !== "android") {
                out += "<p>"; //puts a little too much space between lines
                var active = "<a href=\"po:send//party active:" + name + "\">Active</a>";
                var remove = "<a href=\"po:send//party remove:" + name + "\">Remove</a>";
                out += "[" + active + " / " + remove + "]";
            }
            out += "</td>";
        }
        out += "</tr></table>";
        if (isAndroid) {
            out += "<br />";
        }
        return out;
    };
    this.showBox = function(player, num, isAndroid, textOnly) {
        var out = "";
        var maxPages,
            list = player.pokemon,
            page = parseInt(num, 10);

        if (!isNaN(page) && num != "all") {
            var perBox = itemData.box.bonusRate;
            maxPages = Math.floor(list.length / (perBox)) + (list.length % perBox === 0 ? 0 : 1);

            if (page > maxPages) {
                page = maxPages;
            }
            list = list.slice(perBox * (page - 1), perBox * (page - 1) + perBox);
        }

        if (textOnly) {
            out += this.listPokemonText(list, "Owned Pokémon (" + player.pokemon.length + ")");
        } else {
            out += this.listPokemon(list, "Owned Pokémon (" + player.pokemon.length + ")");
            if (isAndroid) {
                out += "<br />";
            }
        }

        if (!isNaN(page)) {
            if (page > 1) {
                out += "[<a href='po:send//box" + (textOnly? "t" : "" ) + " " + (page - 1) + "'>" + utilities.html_escape("< Box " + (page - 1)) + "</a>]";
            }
            if (page < maxPages) {
                if (page > 1) {
                    out += " ";
                }
                out += "[<a href='po:send//box" + (textOnly? "t" : "" ) + " " + (page + 1) + "'>" + utilities.html_escape("Box " + (page + 1) + " >") + "</a>]";
            }
        }
        return out;
    };
    this.listPokemon = function(list, title) {
        var out = "", normal = [], count = 0, rowSize = 12, e;
        for (e in list) {
            normal.push(pokeInfo.icon(list[e], true));
        }
        out += "<table border = 1 cellpadding = 3><tr><th>" + title + "</th></td></tr><tr><td>";
        for (e in normal) {
            count++;
            out += normal[e] + " ";
            if (count == rowSize) {
                out += "<p>";
                count = 0;
            }
        }
        out += "</td></tr></table>";
        return out;
    };
    this.listPokemonText = function(list, title) {
        var out = "", normal = [], e;
        for (e in list) {
            normal.push(poke(list[e]));
        }
        out += "<b>" + title + "</b><br/>";
        out += normal.join(", ");
        out += "<br/>";
        return out;
    };
    this.showBag = function(player, isAndroid, textOnly) {
        //Manual arrays because easier to put in desired order. Max of 11 in each array or you need to change the colspan. Line1 only gets 9 due to money taking up a slot
        var line1 = ["silver", "box", "bait", "rock", "gacha", "itemfinder", "gem", "battery", "rare", "mega", "entry"];
        var line2 = ["safari", "great", "ultra", "master", "myth", "luxury", "quick", "heavy", "spy", "clone", "premier", "stick"];
        var line3 = ["amulet", "soothe",  "scarf", "eviolite", "crown", "honey", "pearl", "stardust", "bigpearl", "starpiece", "nugget", "bignugget"];

        var out = "";
        out += bagRow(player, line1, isAndroid, textOnly, true);
        out += bagRow(player, line2, isAndroid, textOnly);
        out += bagRow(player, line3, isAndroid, textOnly);
        out += (textOnly ? "" : "</table>");
        return out;
    };
    this.showCostumes = function (player) {
        var out = [], costumeName;
        for (var i = 0; i < allCostumes.length; i++) {
            costumeName = allCostumes[i];
            if (player.costumes[costumeName] > 0) {
                out.push(costumeAlias(costumeName, false, true));
            }
        }
        return "Owned Costumes: " + (out.length > 0 ? out.join(", ") : "None");
    };
    this.changeCostume = function (src, data) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);

        var cos = costumeAlias(data, true);
        var currentTime = now();
        var costumeName = costumeAlias(data, false, true);
        if (cos !== "none") {
            if (allCostumes.indexOf(cos) === -1){
                safaribot.sendMessage(src, cos + " is not a valid costume!", safchan);
                return;
            }
            if (player.costumes[cos] < 1) {
                safaribot.sendMessage(src, "You do not have the " + costumeName + " costume!", safchan);
                return;
            }
            if (player.cooldowns.costume > currentTime) {
                safaribot.sendMessage(src, "You changed your costume recently. Please try again in " + timeLeft(player.cooldowns.costume) + " seconds!", safchan);
                return;
            }
        }

        player.costume = cos;
        player.cooldowns.costume = currentTime + (6 * 60 * 60 * 1000);
        if (cos === "none") {
            safaribot.sendMessage(src, "You removed your costume!", safchan);
        } else {
            safaribot.sendMessage(src, "You changed into your " + costumeName + " costume! [Effect: " + costumeData[cos].effect + "]", safchan);
        }
        this.saveGame(player);
    };
    this.removePokemon = function(src, pokeNum) {
        var player = getAvatar(src);
        if (player.pokemon.contains(pokeNum)) {
            player.pokemon.splice(player.pokemon.lastIndexOf(pokeNum), 1);
        }

        if (countRepeated(player.party, pokeNum) > countRepeated(player.pokemon, pokeNum)) {
            do {
                player.party.splice(player.party.lastIndexOf(pokeNum), 1);
            } while (countRepeated(player.party, pokeNum) > countRepeated(player.pokemon, pokeNum));
        }
    };
    this.removePokemon2 = function(name, pokeNum) {
        var player = getAvatarOff(name);
        if (player.pokemon.contains(pokeNum)) {
            player.pokemon.splice(player.pokemon.lastIndexOf(pokeNum), 1);
        }

        if (countRepeated(player.party, pokeNum) > countRepeated(player.pokemon, pokeNum)) {
            do {
                player.party.splice(player.party.lastIndexOf(pokeNum), 1);
            } while (countRepeated(player.party, pokeNum) > countRepeated(player.pokemon, pokeNum));
        }
    };
    this.findPokemon = function(src, commandData, textOnly) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        if (commandData === "*") {
            sys.sendMessage(src, "", safchan);
            sys.sendMessage(src, "How to use /find:", safchan);
            safaribot.sendMessage(src, "Define a parameter (Name, Number, BST, Type, Shiny or Duplicate) and a value to find Pokémon in your box. Examples: ", safchan);
            safaribot.sendMessage(src, "For Name: Type any part of the Pokémon's name. e.g.: /find name LUG (both Lugia and Slugma will be displayed, among others with LUG on the name)", safchan);
            safaribot.sendMessage(src, "For Type: Type any one or two types. If you type 2, only pokémon with both types will appear. e.g.: /find type water grass", safchan);
            safaribot.sendMessage(src, "For Duplicate: Type a number greater than 1. e.g.: /find duplicate 3 (will display all Pokémon that you have at least 3 copies)", safchan);
            safaribot.sendMessage(src, "For Number and BST: There are 4 ways to search with those parameters:", safchan);
            safaribot.sendMessage(src, "-Exact value. e.g.: /find bst 500 (displays all Pokémon with BST of exactly 500)", safchan);
            safaribot.sendMessage(src, "-Greater than. e.g.: /find bst 400 > (displays all Pokémon with BST of 400 or more)", safchan);
            safaribot.sendMessage(src, "-Less than. e.g.: /find bst 350 < (displays all Pokémon with BST of 350 or less)", safchan);
            safaribot.sendMessage(src, "-Range. e.g.: /find number 1 150 (displays all Pokémon with pokédex number between 1 and 150)", safchan);
            sys.sendMessage(src, "", safchan);
            return;
        }

        var info = commandData.split(":");
        var crit = "abc", val = "1";
        if (info.length < 2) {
            info = commandData.split(" ");
        }

        crit = info[0].toLowerCase();
        val = info.length > 1 ? info[1].toLowerCase() : "asc";

        if (info.length >= 2) {
            switch (crit) {
                case "number":
                case "num":
                case "index":
                case "no":
                case "dex":
                    crit = "number";
                    break;
                case "bst":
                case "status":
                case "stats":
                case "stat":
                    crit = "bst";
                    break;
                case "type":
                    crit = "type";
                    break;
                case "shiny":
                    crit = "shiny";
                break;
                case "duplicate":
                case "duplicates":
                case "repeated":
                    crit = "duplicate";
                    break;
                default:
                    crit = "abc";
            }
        } else if (crit !== "shiny") {
            crit = "abc";
            val = info[0].toLowerCase();
        }

        var list = [], title = "Owned Pokémon", mode = "equal";
        if (crit == "abc") {
            val = val.toLowerCase();
            player.pokemon.forEach(function(x){
                if (sys.pokemon(x).toLowerCase().indexOf(val) !== -1) {
                    list.push(x);
                }
            });
            title = "Pokémon with " + val + " in their name";
        }
        else if (crit == "number") {
            title = rangeFilter(src, player, list, val, mode, "Pokédex Number", info, crit);
        }
        else if (crit == "bst") {
            title = rangeFilter(src, player, list, val, mode, "BST", info, crit);
        }
        else if (crit == "type") {
            var type1 = cap(val.toLowerCase()),
                type2 = null;

            if (info.length > 2) {
                type2 = cap(info[2].toLowerCase());
            }

            if (!(type1 in effectiveness)) {
                safaribot.sendMessage(src, type1 + " is not a valid type!", safchan);
                return;
            }
            if (type2 && !(type2 in effectiveness)) {
                safaribot.sendMessage(src, type2 + " is not a valid type!", safchan);
                return;
            }

            player.pokemon.forEach(function(x){
                if (hasType(x, type1) && (!type2 || hasType(x, type2))) {
                    list.push(x);
                }
            });
            title = "Pokémon with " + type1 + (type2 ? "/" + type2 : "") + " type";
        }
        else if (crit == "shiny") {
            player.pokemon.forEach(function(x){
                if (typeof x === "string") {
                    list.push(x);
                }
            });
            title = "Shiny Pokémon";
        }
        else if (crit == "duplicate") {
            var pokeList = player.pokemon.concat().sort();
            val = parseInt(val, 10);
            if (isNaN(val) || val < 2) {
                safaribot.sendMessage(src, "Please specify a valid number higher than 1!", safchan);
                return;
            }
            pokeList.forEach(function(x){
                if (countArray(pokeList, x) >= val) {
                    list.push(x);
                }
            });
            title = "Pokémon with at least " + val + " duplicates";
        }
        if (textOnly) {
            sys.sendHtmlMessage(src, this.listPokemonText(list, title + " (" + list.length + ")"), safchan);
        } else {
            sys.sendHtmlMessage(src, this.listPokemon(list, title + " (" + list.length + ")"), safchan);
        }
    };
    function rangeFilter(src, player, list, val, mode, paramName, info, type) {
        val = parseInt(val, 10);
        var val2;
        if (isNaN(val)) {
            safaribot.sendMessage(src, "Please specify a valid number!", safchan);
            return;
        }
        var title = "Pokémon with " + paramName + " equal to " + val;
        if (info.length > 2) {
            val2 = parseInt(info[2], 10);
            if (isNaN(val2)) {
                switch (info[2].toLowerCase()) {
                    case ">":
                    case "higher":
                    case "greater":
                    case "more":
                    case "+":
                    case "above":
                        mode = "greater";
                        title = "Pokémon with " + paramName + " greater than " + val;
                        break;
                    case "<":
                    case "lower":
                    case "less":
                    case "-":
                    case "below":
                        mode = "less";
                        title = "Pokémon with " + paramName + " less than " + val;
                        break;
                }
                if (mode !== "greater" && mode !== "less") {
                    safaribot.sendMessage(src, "Invalid parameter! Use either >, < or another number.", safchan);
                    return;
                }
            } else {
                mode = "range";
                title = "Pokémon with " + paramName + " between " + val + " and " + val2;
            }
        }
        var param;
        player.pokemon.forEach(function(x){
            switch (type) {
                case "bst":
                    param = getBST(x);
                    break;
                case "number":
                    param = parseInt(x, 10);
                    break;
            }
            if (mode == "equal" && param === val) {
                list.push(x);
            }
            else if (mode == "greater" && param >= val) {
                list.push(x);
            }
            else if (mode == "less" && param <= val) {
                list.push(x);
            }
            else if (mode == "range" && param >= val && param <= val2) {
                list.push(x);
            }
        });
        return title;
    }
    this.sortBox = function(src, commandData) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);
        var info = commandData.split(":");
        var crit = "number", order = "asc";
        if (info.length < 2) {
            info = commandData.split(" ");
        }
        crit = info[0];
        order = info.length > 1 ? info[1].toLowerCase() : "asc";

        switch (crit.toLowerCase()) {
            case "abc":
            case "alpha":
            case "alphabet":
            case "alphabetical":
            case "name":
                crit = "abc";
                break;
            case "bst":
            case "status":
            case "stats":
            case "stat":
                crit = "bst";
                break;
            case "type":
                crit = "type";
                break;
            case "shiny":
                crit = "shiny";
            break;
            case "duplicate":
            case "duplicates":
            case "repeated":
                crit = "duplicate";
                break;
            default:
                crit = "number";
        }
        switch (order.toLowerCase()) {
            case "descending":
            case "desc":
            case "cba":
            case "321":
                order = "desc";
                break;
            case "ascending":
            case "asc":
            case "abc":
            case "123":
                order = "asc";
        }

        if (crit === "number") {
            player.pokemon.sort(function(a, b){
                if (pokeInfo.species(a) != pokeInfo.species(b)) {
                    return pokeInfo.species(a)-pokeInfo.species(b);
                } else {
                    return pokeInfo.forme(a)-pokeInfo.forme(b);
                }
            });
            if (order === "desc") {
                player.pokemon.reverse();
            }
            safaribot.sendMessage(src, "Your box was sorted by Pokédex Number (" + (order === "desc" ? "descending" : "ascending") + ").", safchan);
        }
        else if (crit === "abc") {
            player.pokemon.sort(function(a, b){
                    if(sys.pokemon(a) < sys.pokemon(b)) return -1;
                    if(sys.pokemon(a) > sys.pokemon(b)) return 1;
                    return 0;
                }
            );

            if (order === "desc") {
                player.pokemon.reverse();
            }
            safaribot.sendMessage(src, "Your box was sorted " + (order === "desc" ? "inversely " : "") + "alphabetically.", safchan);
        }
        else if (crit === "bst") {
            player.pokemon.sort(function(a, b){return getBST(a)-getBST(b);});
            if (order === "desc") {
                player.pokemon.reverse();
            }
            safaribot.sendMessage(src, "Your box was sorted by BST (" + (order === "desc" ? "descending" : "ascending") + ").", safchan);
        }
        else if (crit === "shiny") {
            player.pokemon.sort(function(a, b){
                if (typeof a === "string" && typeof b !== "string") {
                    return -1;
                } else if (typeof a !== "string" && typeof b === "string") {
                    return 1;
                } else {
                    return 0;
                }
            });
            if (order === "desc") {
                player.pokemon.reverse();
            }
            safaribot.sendMessage(src, "Your box was sorted by Shiny Pokémon (" + (order === "desc" ? "descending" : "ascending") + ").", safchan);
        }
        else if (crit === "type") {
            var type1 = cap(order.toLowerCase());
            if (!(type1 in effectiveness)) {
                safaribot.sendMessage(src, "Please specify a valid type!", safchan);
                return;
            }
            var type2 = info.length > 2 ? cap(info[2].toLowerCase()) : null;
            if (type2 && !(type2 in effectiveness)) {
                safaribot.sendMessage(src, "Please specify a valid secondary type!", safchan);
                return;
            }

            player.pokemon.sort(function(a, b) {
                if (hasType(a, type1) && !hasType(b, type1)) {
                    return -1;
                }
                if (!hasType(a, type1) && hasType(b, type1)) {
                    return 1;
                }
                if (type2) {
                    if (hasType(a, type2) && !hasType(b, type2)) {
                        return -1;
                    }
                    if (!hasType(a, type2) && hasType(b, type2)) {
                        return 1;
                    }
                }
                return 0;
            });

            safaribot.sendMessage(src, "Your box was sorted by types (" +(type2 ? type1 + "/" + type2 + " > " : "")+ type1 + (type2 ? " > " + type2 : "" ) + ").", safchan);
        }
        else if (crit === "duplicate") {
            player.pokemon.sort();
            player.pokemon.sort(function(a, b){return countArray(player.pokemon, a)-countArray(player.pokemon, b);});
            if (order === "desc") {
                player.pokemon.reverse();
            }
            safaribot.sendMessage(src, "Your box was sorted by duplicates (" + (order === "desc" ? "descending" : "ascending") + ").", safchan);
        }
        this.saveGame(player);
    };
    this.dailyReward = function(src, today) {
        var player = getAvatar(src);
        if (!player) {
            return;
        }

        if (today > player.lastLogin) {
            if (today !== player.lastLogin + 1) {
                player.consecutiveLogins = 0;
            }
            player.consecutiveLogins += 1;
            player.lastLogin = today;
            var logins = player.consecutiveLogins;

            var gained = [];
            var moneyGained = 250 + 25 * logins;
            if (moneyGained > 1000) {
                moneyGained = 1000;
            }
            gained.push("$" + moneyGained);
            player.money += moneyGained;
            if (player.money > moneyCap) {
                player.money = moneyCap;
            }

            var safariGained = logins;
            if (safariGained > 30) {
                safariGained = 30;
            }
            player.balls.safari += safariGained;
            if (player.balls.safari > itemCap) {
                player.balls.safari = itemCap;
            }
            gained.push(safariGained + "x Safari Ball" + (safariGained > 1 ? "s" : ""));

            var milestone = logins % 32;
            var milestoneRewards = {
                "31": { reward: "master", amount: 1 },
                "27": { reward: "gacha", amount: 30 },
                "24": { reward: "clone", amount: 5 },
                "21": { reward: "luxury", amount: 5 },
                "18": { reward: "gacha", amount: 15 },
                "15": { reward: "rare", amount: 1 },
                "12": { reward: "bait", amount: 10 },
                "9": { reward: "ultra", amount: 5, repeatAmount: 15},
                "6": { reward: "great", amount: 8, repeatAmount: 25},
                "3": { reward: "rock", amount: 5, repeatAmount: 25}
            };

            if (milestone in milestoneRewards) {
                var reward = milestoneRewards[milestone];
                var item = reward.reward;
                var amount = logins > 30 && "repeatAmount" in reward? reward.repeatAmount : reward.amount;

                player.balls[item] += amount;
                var cap = item == "master" ? 1 : itemCap;
                if (player.balls[item] > cap) {
                    player.balls[item] = cap;
                }
                gained.push(amount + "x " + finishName(item) + (amount > 1 ? "s" : ""));
            }
            if (logins > player.records.consecutiveLogins) {
                player.records.consecutiveLogins = logins;
            }

            var perkBonus = Math.min(itemData.battery.bonusRate * player.balls.battery, itemData.battery.maxRate);
            var recharges = 30 + perkBonus;
            player.balls.itemfinder = recharges;

            safaribot.sendMessage(src, "You received the following rewards for joining Safari today: " + gained.join(", "), safchan);
            safaribot.sendMessage(src, "Your Itemfinder has been recharged to " + recharges + " charges!", safchan);
            this.saveGame(player);
        }
    };
    this.showRecords = function (src) {
        if (!validPlayers("self", src)) {
            return;
        }
        var player = getAvatar(src);

        var rec = player.records;

        sys.sendMessage(src, "", safchan);
        sys.sendMessage(src, "*** Player Records ***", safchan);
        safaribot.sendMessage(src, "Pokémon-- Caught: " + rec.pokesCaught + ". Released: " + rec.pokesReleased + ". Evolved: " + rec.pokesEvolved + ". Cloned: " + rec.pokesCloned + ". Failed Catches: " + rec.pokesNotCaught + ".", safchan);
        safaribot.sendMessage(src, "Earnings-- Sold Pokémon: $" + rec.pokeSoldEarnings + ". Luxury Balls: $" + rec.luxuryEarnings + ". Pawned Items: $" + rec.pawnEarnings + ". Own Window Broken: $" + rec.rocksWindowEarned + ". Rocking Wallets: $" + rec.rocksWalletEarned + ".", safchan);
        safaribot.sendMessage(src, "Losses-- Breaking Windows: -$" + rec.rocksWindowLost + " Own Wallet Rocked: -$" + rec.rocksWalletLost + ".", safchan);
        safaribot.sendMessage(src, "Gachapon-- Used: " + rec.gachasUsed + ". Jackpots Won: " + rec.jackpotsWon + ". Master Balls Won: " + rec.masterballsWon + ". Items stolen by Pokémon: " + rec.capsulesLost + ".", safchan);
        //Seasonal change
        safaribot.sendMessage(src, itemData.rock.fullName + "s-- Thrown: " + rec.rocksThrown + ". Hit: " + rec.rocksHit + ". Missed: " + rec.rocksMissed + ". Broke Apart: " + rec.rocksBounced + ". Hit By: " + rec.rocksHitBy + ". Dodged: " + rec.rocksDodged + ". Caught: " + rec.rocksCaught + ". Hit a Wallet: " + rec.rocksWalletHit + ". Own Wallet Hit: " + rec.rocksWalletHitBy + ". Windows Broken: " + rec.rocksMissedWindow + ". Own Window Broken: " + rec.rocksDodgedWindow, safchan);
        safaribot.sendMessage(src, "Bait-- Used: " + rec.baitUsed + ". Attracted Pokémon: " + rec.baitAttracted + ". No Interest: " + rec.baitNothing + ".", safchan);
        safaribot.sendMessage(src, "Misc-- Contests Won: " + rec.contestsWon + ". Consecutive Logins: " + rec.consecutiveLogins + ". Items Found: " + rec.itemsFound + ". Items Discarded: " + rec.itemsDiscarded + ".", safchan);
        safaribot.sendMessage(src, "Quests-- Pokémon given to Collector: " + rec.collectorGiven + ". Money from Collector: $" + rec.collectorEarnings + ". Pokémon given to Scientist: " + rec.scientistGiven + ". Silver Coins received from Scientist: " + rec.scientistEarnings + ". Arena Battles: " + rec.arenaWon + " won, " + rec.arenaLost + " lost (" + rec.arenaPoints + " points). " , safchan);
        sys.sendMessage(src, "", safchan);
    };
    this.compileThrowers = function() {
        var name, e;
        for (e in contestantsWild) {
            name = contestantsWild[e];
            if (!(name in contestantsCount)) {
                contestantsCount[name] = 0;
            }
            contestantsCount[name]++;
        }
        contestantsWild = [];
    };
    this.isBattling = function(name) {
        for (var b in currentBattles) {
            if (currentBattles[b].isInBattle(name)) {
                return true;
            }
        }
        return false;
    };
    this.isInAuction = function(name) {
        for (var b in currentAuctions) {
            if (currentAuctions[b].isInAuction(name)) {
                return true;
            }
        }
        return false;
    };

    function Battle(p1, p2) {
        var player1 = getAvatar(p1);

        this.name1 = sys.name(p1);
        this.viewers = [this.name1.toLowerCase()];
        this.team1 = player1.party.concat().shuffle();

        var isNPC = this.npcBattle = typeof p2 == "object";
        var player2 = isNPC ? p2 : getAvatar(p2);
        if (isNPC) {
            this.name2 = player2.name;
            this.team2 = player2.party.concat().shuffle();
            if (!player2.power || player2.length < 2) {
                player2.power = [10, 100];
            }
            this.powerMin = player2.power[0];
            this.powerMax = player2.power[1];
            this.postBattle = player2.postBattle;
            this.postArgs = player2.postArgs;
        } else {
            this.name2 = sys.name(p2);
            this.viewers.push(this.name2.toLowerCase());
            this.team2 = player2.party.concat().shuffle();
        }

        this.turn = -1;
        this.duration = Math.min(this.team1.length, this.team2.length);
        if (this.team1.length > this.duration) {
            this.team1 = this.team1.slice(0, this.duration);
        }
        if (this.team2.length > this.duration) {
            this.team2 = this.team2.slice(0, this.duration);
        }

        this.p1Score = 0;
        this.p2Score = 0;
        this.p1TotalScore = 0;
        this.p2TotalScore = 0;
        this.scoreOrder = [];
        this.finished = false;

        safaribot.sendHtmlAll("A battle between " + this.name1 + " and " + this.name2 + (isNPC ? " (NPC)" : "") + " has started! [<a href='po:send//watch " + this.name1 + "'>Watch</a>]", safchan);
    }
    Battle.prototype.nextTurn = function() {
        if (this.turn < 0) {
            this.turn++;
            this.sendToViewers("Preparations complete, battle will start soon!");
            return;
        }
        var p1Poke = this.team1[this.turn];
        var p2Poke = this.team2[this.turn];

        var p1Type1 = sys.type(sys.pokeType1(p1Poke)), p1Type2 = sys.type(sys.pokeType2(p1Poke));
        var p2Type1 = sys.type(sys.pokeType1(p2Poke)), p2Type2 = sys.type(sys.pokeType2(p2Poke));

        var p1Bonus = safari.checkEffective(p1Type1, p1Type2, p2Type1, p2Type2);
        var p2Bonus = safari.checkEffective(p2Type1, p2Type2, p1Type1, p1Type2);

        var p1Move = sys.rand(10, 100);
        var p2Move = sys.rand(this.npcBattle ? this.powerMin : 10, this.npcBattle ? this.powerMax : 100);

        var statName = ["HP", "Attack", "Defense", "Sp. Atk", "Sp. Def", "Speed"];
        var stat = sys.rand(0, 6);
        var sName = statName[stat];

        var p1Stat = sys.baseStats(p1Poke, stat);
        var p2Stat = sys.baseStats(p2Poke, stat);

        var p1Power = Math.round((p1Stat + p1Move) * p1Bonus);
        var p2Power = Math.round((p2Stat + p2Move) * p2Bonus);

        var name1 = this.name1 + "'s " + poke(p1Poke);
        var name2 = this.name2 + "'s " + poke(p2Poke);

        this.sendToViewers("Turn " + (this.turn + 1) + " | " + sName + " | " + name1 + " " + pokeInfo.icon(p1Poke) + " x " + pokeInfo.icon(p2Poke) + " " + name2);
        this.sendToViewers(name1 + " | " + sName + ": " + p1Stat + " | Move Power: " + p1Move + " | Type Effectiveness: " + p1Bonus + "x");
        this.sendToViewers(name2 + " | " + sName + ": " + p2Stat + " | Move Power: " + p2Move + " | Type Effectiveness: " + p2Bonus + "x");

        if (p1Power > p2Power) {
            this.p1Score++;
            this.scoreOrder.push(1);
            this.sendToViewers("Result: <b>" + name1 + " (" + p1Power + ")</b> x (" + p2Power + ") " + name2, true);
        }
        else if (p2Power > p1Power) {
            this.p2Score++;
            this.scoreOrder.push(2);
            this.sendToViewers("Result: " + name1 + " (" + p1Power + ") x <b>(" + p2Power + ") " + name2 + "</b>", true);
        }
        else {
            this.scoreOrder.push(0);
            this.sendToViewers("Result: " + name1 + " (" + p1Power + ") x (" + p2Power + ") " + name2 + " | <b>Draw</b>", true);
        }

        this.p1TotalScore += p1Power;
        this.p2TotalScore += p2Power;

        this.turn++;
        if (this.turn >= this.duration) {
            if (this.turn == this.duration && this.p1Score == this.p2Score) {
                this.team1.push(this.team1.random());
                this.team2.push(this.team2.random());
                this.sendToViewers("No winner after the regular rounds! An extra tiebreaker round will be held!", true);
            } else {
                this.finishBattle();
            }
        }
        this.sendToViewers("");
    };
    Battle.prototype.finishBattle = function() {
        var winner = 0, loser, score, tiebreaker = false, tiebreakerMsg;
        if (this.p1Score > this.p2Score) {
            winner = 1;
        }
        else if (this.p2Score > this.p1Score) {
            winner = 2;
        }
        else {
            var e;
            if (this.p1TotalScore > this.p2TotalScore) {
                winner = 1;
                tiebreakerMsg = "More damage dealt - " + this.p1TotalScore + " x " + this.p2TotalScore;
                tiebreaker = true;
            }
            else if (this.p1TotalScore < this.p2TotalScore) {
                winner = 2;
                tiebreakerMsg = "More damage dealt - " + this.p2TotalScore + " x " + this.p1TotalScore;
                tiebreaker = true;
            } else {
                for (e = 0; e < this.scoreOrder.length; e++) {
                    if (this.scoreOrder[e] !== 0) {
                        winner = this.scoreOrder[e];
                        tiebreaker = true;
                        tiebreakerMsg = "First to score";
                        break;
                    }
                }
            }
        }
        if (winner === 1) {
            winner = this.name1;
            loser = this.name2;
            score = this.p1Score + " x " + this.p2Score;
        } else if (winner == 2) {
            winner = this.name2;
            loser = this.name1;
            score = this.p2Score + " x " + this.p1Score;
        }

        if (winner) {
            this.sendToViewers("<b>" + winner + " defeated " + loser + " in a battle with a score of " + score + (tiebreaker ? " (Tiebreaker: " + tiebreakerMsg + ")" : "") + "!</b>", true);
        } else {
            this.sendToViewers("<b>The battle between " + this.name1 + " and " + this.name2 + " ended in a draw!</b>", true);
        }
        if (this.npcBattle && this.postBattle) {
            this.postBattle(this.name1, winner === this.name1, this.p1Score, this.p2Score, this.postArgs);
        }
        this.finished = true;
    };
    Battle.prototype.sendMessage = function(name, msg) {
        var id = sys.id(name);
        if (id) {
            if (msg === "") {
                sys.sendHtmlMessage(id, msg, safchan);
            } else {
                safaribot.sendHtmlMessage(id, msg, safchan);
            }
        }
    };
    Battle.prototype.sendToViewers = function(msg, bypassUnwatch) {
        var e;
        for (e in this.viewers) {
            this.sendMessage(this.viewers[e], msg);
        }
        if (bypassUnwatch) {
            if (!this.viewers.contains(this.name1.toLowerCase())) {
                this.sendMessage(this.name1, msg);
            }
            if (!this.npcBattle && !this.viewers.contains(this.name2.toLowerCase())) {
                this.sendMessage(this.name2, msg);
            }
        }
    };
    Battle.prototype.isInBattle = function(name) {
        return this.name1.toLowerCase() == name.toLowerCase() || (!this.npcBattle && this.name2.toLowerCase() == name.toLowerCase());
    };

    function Auction(src, product, starting, minBid) {
        this.host = sys.name(src).toLowerCase();
        this.hostName = sys.name(src);

        this.members = [];
        this.product = product;
        this.startingOffer = starting;
        this.minBid = minBid;

        this.currentOffer = starting - minBid;
        this.currentBidder = null;
        this.unbiddedTurns = 0;
        this.suddenDeath = false;
        this.suddenDeathOffers = {};
        this.confirmBid = {};

        this.turn = 0;
        this.finished = false;
        this.changed = false;

        if (product[0] == "@") {
            this.product = product.substr(product.indexOf("@") + 1);
            this.productName = itemAlias(this.product, false, true);
            this.type = "item";
        } else {
            this.productName = getInputPokemon(product).name;
            this.type = "poke";
        }

        var joinCommand = "/join " + this.hostName;
        sys.sendAll("", safchan);
        safaribot.sendHtmlAll(this.hostName + " is starting an auction! The product is a " + this.productName + ", with bids starting at $" + addComma(starting) + " (Minimum bid raise: $" + addComma(minBid) + ")! Type <a href='po:send/" + joinCommand + "'>" + joinCommand + "</a> to join the auction!", safchan);
        safaribot.sendMessage(src, "You started an auction! The auction ends when the current bid is not matched after 3 turns or if no one makes a bid for the first 40 seconds!", safchan);
        sys.sendAll("", safchan);
    }
    Auction.prototype.nextTurn = function() {
        if (this.turn === 0) {
            this.turn++;
            this.sendToViewers("[Auction] Preparations complete, the auction will start soon!");
            return;
        }
        if (this.turn == 5 && !this.currentBidder) {
            this.sendToViewers("");
            this.sendToViewers("[Auction] Auction cancelled because no bids have been made!");
            this.sendToViewers("");
            this.finished = true;
            return;
        }

        if (this.turn > 20) {
            if (this.turn === 21) {
                if (this.changed) {
                    this.unbiddedTurns = 0;
                }
                this.unbiddedTurns++;
                if (this.checkWinner()) {
                    return;
                }
                this.sendToViewers("");
                this.sendToViewers("[Auction] No winner after 20 turns! Auction will now proceed to sudden death mode!");
                this.sendToViewers("[Auction] All participants can make one last secret bid. All offers will be revealed simultaneously. Highest offer wins.");
                this.sendToViewers("");
                this.turn++;
                this.suddenDeath = true;
                return;
            }
            if (this.turn === 22) {
                this.turn++;
                this.sendToViewers("");
                this.sendToViewers("[Auction] Please make your final bid if you haven't made it yet!");
                this.sendToViewers("");
                return;
            }
            for (var e in this.suddenDeathOffers) {
                if (this.suddenDeathOffers[e] > this.currentOffer) {
                    this.currentOffer = this.suddenDeathOffers[e];
                    this.currentBidder = e;
                }
            }

            this.finishAuction();
        } else {
            if (this.changed) {
                this.unbiddedTurns = 0;
            }
            if (this.currentBidder) {
                this.unbiddedTurns++;
                if (this.checkWinner()) {
                    return;
                }

                this.sendToViewers("");
                this.sendToViewers("[Auction] Current highest bid is $" + addComma(this.currentOffer) + " by " + this.currentBidder.toCorrectCase() + "!");
                if (this.unbiddedTurns > 0) {
                    this.sendToViewers("[Auction] If no one bids more, " + this.currentBidder.toCorrectCase() + " will win the auction in " + (4 - this.unbiddedTurns) + "  turn(s)!");
                }
                this.sendToViewers("");
            }
            this.changed = false;
        }
        this.turn++;
    };
    Auction.prototype.checkWinner = function() {
        if (this.unbiddedTurns >= 4) {
            this.finishAuction();
            return true;
        }
        return false;
    };
    Auction.prototype.finishAuction = function() {
        this.sendToViewers("");
        this.sendToViewers("[Auction] The auction is finished! " + this.currentBidder.toCorrectCase() + " takes the " + this.productName + " for $" + addComma(this.currentOffer) + "!");
        if (this.suddenDeath && Object.keys(this.suddenDeathOffers).length > 0) {
            var allOffers = [];
            for (var e in this.suddenDeathOffers) {
                allOffers.push(e.toCorrectCase() + " ($" + addComma(this.suddenDeathOffers[e]) + ")");
            }
            this.sendToViewers("[Auction] All offers: " + allOffers.join(", "));
        }

        var host = getAvatarOff(this.host);
        var winner = getAvatarOff(this.currentBidder);

        winner.money -= this.currentOffer;
        host.money += this.currentOffer;

        if (this.type == "item") {
            host.balls[this.product] -= 1;
            winner.balls[this.product] += 1;
        } else {
            var input = getInputPokemon(this.product);

            safari.removePokemon2(this.host, input.id);
            winner.pokemon.push(input.id);
        }

        safari.saveGame(host);
        safari.saveGame(winner);

        var id = sys.id(this.host);
        if (id) {
            safaribot.sendMessage(id, "You received $" + addComma(this.currentOffer) + " from " + this.currentBidder.toCorrectCase() + " for your " + this.productName + "!", safchan);
        }
        id = sys.id(this.currentBidder);
        if (id) {
            safaribot.sendMessage(id, "You bought a " + this.productName + " from " + this.hostName + " for $" + addComma(this.currentOffer) + "!", safchan);
        }
        this.sendToViewers("");
        this.finished = true;

        sys.appendToFile(auctionLog, now() + "|||" + this.hostName + "::" + 1 + "::" + this.productName + "::" + this.currentOffer + "|||" + this.currentBidder.toCorrectCase() + "\n");
    };
    Auction.prototype.join = function(src) {
        if (!safari.isBelowCap(src, this.product, 1, this.type)) {
            return;
        }

        this.sendToViewers(sys.name(src) + " has joined the auction!");
        this.members.push(sys.name(src).toLowerCase());
        sys.sendMessage(src, "", safchan);
        safaribot.sendHtmlMessage(src, "You joined " + this.hostName + "'s auction for a " + this.productName + ". Type <a href='po:setmsg//bid " + (this.currentOffer + this.minBid) + "'>/bid [value]</a> to make your offer, or <a href='po:send//leave'>/leave</a> to quit the auction.", safchan);
        if (this.currentBidder) {
            safaribot.sendMessage(src, "The current offer is $" + addComma(this.currentOffer) + ". You can only make offers at least $" + addComma(this.minBid) + " higher than the current offer.", safchan);
        } else {
            safaribot.sendMessage(src, "No offer has been made yet, so you can bid the starting offer ($" + addComma(this.currentOffer + this.minBid) + "). Further offers must at least $" + addComma(this.minBid) + " higher than the current one.", safchan);
        }
        sys.sendMessage(src, "", safchan);
    };
    Auction.prototype.leave = function(src) {
        var name = sys.name(src).toLowerCase();
        if (this.host == name) {
            safaribot.sendMessage(src, "You can't leave your own auction!", safchan);
            return;
        }
        if (this.currentBidder == name) {
            safaribot.sendMessage(src, "You can't leave the auction while your bid is the highest one!", safchan);
            return;
        }
        if (this.suddenDeath) {
            safaribot.sendMessage(src, "You can't leave the auction while it's in sudden death mode!", safchan);
            return;
        }

        this.members.splice(this.members.indexOf(name), 1);
        this.sendToViewers(sys.name(src) + " left the auction!");
        safaribot.sendMessage(src, "You left " + this.hostName + "'s auction!", safchan);
    };
    Auction.prototype.makeOffer = function(src, bid) {
        var player = getAvatar(src);
        var id = sys.name(src).toLowerCase();

        if (id == this.host) {
            safaribot.sendMessage(src, "You can't bid in your own auction!", safchan);
            return;
        }
        if (this.turn === 0) {
            safaribot.sendMessage(src, "Please wait a moment before making a bid!", safchan);
            return;
        }

        var offer = parseInt(bid, 10);
        if (isNaN(offer) || offer < 1) {
            safaribot.sendMessage(src, "Please offer a valid value!", safchan);
            return;
        }
        if (offer < this.currentOffer + this.minBid) {
            safaribot.sendMessage(src, "You must offer a minimum of $" + addComma(this.currentOffer + this.minBid) + "!", safchan);
            return;
        }
        if (player.money < offer) {
            safaribot.sendMessage(src, "You do not have $" + addComma(offer) + "!", safchan);
            return;
        }

        if (offer >= this.currentOffer * 10 && (!(id in this.confirmBid) || this.confirmBid[id] != offer)) {
            safaribot.sendMessage(src, "Do you really want to offer $" + addComma(offer) + " or was that a typo? If you really want to offer that, make that bid again!", safchan);
            this.confirmBid[id] = offer;
            return;
        }
        delete this.confirmBid[id];

        if (this.suddenDeath) {
            safaribot.sendMessage(src, "[Auction] You are offering $" + addComma(offer) + " for the " + this.productName + "!", safchan);
            this.suddenDeathOffers[id] = offer;
        } else {
            this.sendToViewers("");
            this.sendToViewers("[Auction] " + sys.name(src) + " is offering $" + addComma(offer) + " for the " + this.productName + "!");

            if (id !== this.currentBidder) {
                this.changed = true;
            }
            this.currentBidder = id;
            this.currentOffer = offer;
        }
    };
    Auction.prototype.sendMessage = function(name, msg) {
        var id = sys.id(name);
        if (id) {
            if (msg === "") {
                sys.sendHtmlMessage(id, msg, safchan);
            } else {
                safaribot.sendHtmlMessage(id, msg, safchan);
            }
        }
    };
    Auction.prototype.sendToViewers = function(msg) {
        var e;
        for (e in this.members) {
            this.sendMessage(this.members[e], msg);
        }
        this.sendMessage(this.host, msg);
    };
    Auction.prototype.isInAuction = function(name) {
        return this.host == name.toLowerCase() || this.members.contains(name.toLowerCase());
    };

    this.startGame = function(src, data) {
        if (getAvatar(src) || SESSION.users(src).smute.active) {
            safaribot.sendMessage(src, "You already have a starter pokémon!", safchan);
            return;
        }
        if (!sys.dbRegistered(sys.name(src).toLowerCase())) {
            safaribot.sendMessage(src, "Please register your account before starting the game!", safchan);
            return true;
        }
        if (rawPlayers.get(sys.name(src).toLowerCase())) {
            safaribot.sendMessage(src, "You already have a save under that alt! Loading it instead.", safchan);
            this.loadGame(src);
            return;
        }
        var num = getInputPokemon(data).num;
        if (!num || starters.indexOf(num) === -1) {
            safaribot.sendMessage(src, "Invalid Pokémon! Possible choices: " + starters.map(sys.pokemon).join(", "), safchan);
            return;
        }

        var player = JSON.parse(JSON.stringify(playerTemplate));

        player.id = sys.name(src).toLowerCase();
        player.pokemon.push(num);
        player.party.push(num);
        player.starter = num;

        player.money = 300;
        player.balls.safari = 30;
        player.balls.great = 5;
        player.balls.ultra = 1;
        player.balls.bait = 10;
        player.balls.itemfinder = 15;

        player.lastLogin = getDay(now());
        player.altlog.push(sys.name(src).toLowerCase());

        SESSION.users(src).safari = player;
        this.assignIdNumber(player);
        this.saveGame(player);
        safaribot.sendMessage(src, "You received a " + poke(num) + ", 30 Safari Balls, 10 Baits, 5 Great Balls, 1 Ultra Ball and 15 Itemfinder charges!", safchan);
    };
    this.saveGame = function(player) {
        rawPlayers.add(player.id, JSON.stringify(player));
    };
    this.loadGame = function(src) {
        var data = rawPlayers.get(sys.name(src).toLowerCase());
        if (data) {
            var player = JSON.parse(data);
            SESSION.users(src).safari = player;
            this.sanitize(getAvatar(src));
            safaribot.sendMessage(src, "Your Safari data was successfully loaded!", safchan);
            this.dailyReward(src, getDay(now()));
            this.revertMega(src);
        } else if (getAvatar(src)) {
            SESSION.users(src).safari = null;
        }
    };
    this.updateLeaderboards = function() {
        leaderboards = {};

        var player, data, e, i;
        for (e in leaderboardTypes) {
            leaderboards[e] = [];
        }
        for (e in rawPlayers.hash) {
            data = JSON.parse(rawPlayers.hash[e]);
            for (i in leaderboardTypes) {
                player = {
                    name: e,
                    value: 0
                };
                switch (i) {
                    case "totalPokes":
                        player.value = data.pokemon.length;
                    break;
                    case "bst":
                        player.value = add(data.pokemon.map(getBST));
                    break;
                    case "money":
                        player.value = data.money;
                    break;
                    case "salt":
                        player.value = data.balls.salt || 0;
                    break;
                    default:
                        player.value = "records" in data ? (data.records[i] || 0 ): 0;
                    break;
                }
                if (player.value === 0) {
                    continue;
                }
                leaderboards[i].push(player);
            }
        }
        var byHigherValue = function(a, b) {
            return b.value - a.value;
        };
        for (e in leaderboards) {
            leaderboards[e].sort(byHigherValue);
        }
        lastLeaderboardUpdate = new Date().toUTCString();
    };
    this.changeDailyBoost = function(data) {
        var randomNum, bst;

        if (data) {
            randomNum = getInputPokemon(data).num;
            bst = getBST(randomNum);
        }
        if (!randomNum) {
            do {
                randomNum = sys.rand(1, 722);
                bst = getBST(randomNum);

            } while (bst > 498 || isLegendary(randomNum));
        }

        var bonus = 1.6 - (318 - (498 - bst)) * 0.4 / 318;

        dailyBoost = {
            pokemon: randomNum,
            bonus: bonus,
            expires: now() + 24 * 60 * 60 * 1000
        };
        permObj.add("dailyBoost", JSON.stringify(dailyBoost));
        permObj.save();
        sys.sendAll("*** ************************************************************ ***", safchan);
        safaribot.sendAll("The Boost-of-the-Day is now " + sys.pokemon(randomNum) + ", who will give a bonus catch rate of " + bonus.toFixed(2) + "x if used as your active Pokémon!", safchan);
        sys.sendAll("*** ************************************************************ ***", safchan);
    };
    this.changeAlt = function(src, data) {
        if (!validPlayers("self", src)) {
            return;
        }
        var targetId = sys.id(data);
        if (!targetId) {
            safaribot.sendMessage(src, "No such person!", safchan);
            return;
        }
        if (sys.ip(targetId) !== sys.ip(src)) {
            safaribot.sendMessage(src, "Both accounts must be on the same IP to switch!", safchan);
            return true;
        }
        this.transferAlt(sys.name(src), data, src);
    };
    this.transferAlt = function(name1, name2, user) {
        var player = getAvatarOff(name1);
        var target = getAvatarOff(name2);
        
        var src = sys.id(name1);
        var targetId = sys.id(name2);
        var byAuth = sys.name(user).toLowerCase() != name1.toLowerCase();
        
        if (!player) {
            safaribot.sendMessage(user, "There's no Safari data under the " + name1.toCorrectCase() + " name!", safchan);
            return;
        }
        if (name1.toLowerCase() == name2.toLowerCase()) {
            safaribot.sendMessage(user, "You can't pass it to the same alt!", safchan);
            return;
        }
        if (!sys.dbRegistered(name2.toLowerCase())) {
            safaribot.sendMessage(user, "That account isn't registered so you can't pass Safari data to them!", safchan);
            return true;
        }
        if (this.isBattling(name1)) {
            safaribot.sendMessage(user, "You can't pass save data while one of the players is in a battle!", safchan);
            return true;
        }
        if (player.tradeban > 0) {
            if (!byAuth) {
                safaribot.sendMessage(user, "You can't pass save data while you are tradebanned!", safchan);
            } else {
                safaribot.sendMessage(user, "You can't pass save data while " + name1.toCorrectCase() + " is tradebanned!", safchan);
            }
            return true;
        }
        if (this.isInAuction(name1)) {
            safaribot.sendMessage(user, "You can't pass save data while one of the players is participating in an auction!", safchan);
            return;
        }
        
        if (target) {
            if (target.tradeban > 0) {
                safaribot.sendMessage(user, "You can't pass save data to a tradebanned save!!", safchan);
                return true;
            }
            if (this.isBattling(name2)) {
                safaribot.sendMessage(user, "You can't pass save data while one of the players is in a battle!", safchan);
                return true;
            }
            if (this.isInAuction(name2)) {
                safaribot.sendMessage(user, "You can't pass save data while one of the players is participating in an auction!", safchan);
                return;
            }
            var tId = target.id;
            target.id = player.id;
            player.id = tId;

            if (target.altlog.indexOf(target.id) === -1) {
                target.altlog.push(target.id);
            }
            if (player.altlog.indexOf(player.id) === -1) {
                player.altlog.push(player.id);
            }
            
            if (src) {
                SESSION.users(src).safari = target;
                this.clearPlayer(src);
                safaribot.sendMessage(src, "You swapped Safari data with " + name2.toCorrectCase() + "!", safchan);
            }
            if (targetId) {
                SESSION.users(targetId).safari = player;
                this.clearPlayer(targetId);
                safaribot.sendMessage(targetId, "You swapped Safari data with " + name1.toCorrectCase() + "!", safchan);
            }
            this.saveGame(player);
            this.saveGame(target);

            sys.appendToFile(altLog, now() + "|||" + name1 + " <--> " + name2 + "|||" + sys.name(user) + "\n");
        } else {
            if (src) {
                SESSION.users(src).safari = null;
            }
            rawPlayers.remove(player.id);
            
            if (targetId) {
                SESSION.users(targetId).safari = player;
            }
            
            player.id = name2.toLowerCase();
            if (player.altlog.indexOf(player.id) === -1) {
                player.altlog.push(player.id);
            }
            
            if (src) {
                this.clearPlayer(src);
            }
            if (targetId) {
                this.clearPlayer(targetId);
            }
            this.saveGame(player);
            
            if (src) {
                safaribot.sendMessage(src, "You passed your Safari data to " + name2.toCorrectCase() + "!", safchan);
            }
            if (targetId) {
                safaribot.sendMessage(targetId, name1.toCorrectCase() + " passed their Safari data to you!", safchan);
            }
            sys.appendToFile(altLog, now() + "|||" + name1 + " --> " + name2 + "|||" + sys.name(user) + "\n");
        }
    };
    this.logLostCommand = function(user, command, info) {
        sys.appendToFile(lostLog, now() + "|||" + user + "::" + command + "::" + (info || ".") + "\n");
    };
    this.clearPlayer = function(src) {
        var name = sys.name(src).toLowerCase();
        if (name in tradeRequests) {
            delete tradeRequests[name];
        }
        if (name in challengeRequests) {
            delete challengeRequests[name];
        }
    };
    this.saveShop = function() {
        permObj.add("npcShop", JSON.stringify(npcShop));
    };
    
    this.showLog = function(src, commandData, file, name, parser) {
        var log = sys.getFileContent(file);

        if (log) {
            var info = commandData.split(":"),
                range = getRange(info[0]),
                term = info.length > 1 ? info[1] : "",
                e;
                
            log = log.split("\n");
            if (log.indexOf("") !== -1) {
                log.splice(log.indexOf(""), 1);
            }
            if (!range) {
                range = { lower: 0, upper: 10 };
            }
            log = getArrayRange(log.reverse(), range.lower, range.upper).reverse();
            
            if (term) {
                var exp = new RegExp(term, "gi");
                for (e = log.length - 1; e >= 0; e--) {
                    if (!exp.test(log[e])) {
                        log.splice(e, 1);
                    }
                }
            }
            if (log.length <= 0) {
                safaribot.sendMessage(src, "No " + name + " log found for this query!", safchan);
            } else {
                sys.sendMessage(src, "", safchan);
                sys.sendMessage(src, cap(name) + " Log (last " + (range.lower > 1 ? range.lower + "~" : "") + range.upper + " entries" + (term ? ", only including entries with the term " + term : "") + "):", safchan);
                for (e in log) {
                    if (!log[e]) {
                        continue;
                    }
                    safaribot.sendMessage(src, parser(log[e]), safchan);
                }
                sys.sendMessage(src, "", safchan);
            }
        } else {
            safaribot.sendMessage(src, cap(name) + " Log not found!", safchan);
        }
    };
    this.sanitize = function(player) {
        if (player) {
            var clean, i;
            var toTemplate = function(obj, prop, template) {
                var p;
                if (obj[prop] === undefined) {
                    if (Array.isArray(template[prop])) {
                        obj[prop] = [];
                    } else if (typeof template[prop] == "object") {
                        obj[prop] = {};
                        for (p in template[prop]) {
                            toTemplate(obj[prop], p, template[prop]);
                        }
                    } else {
                        obj[prop] = template[prop];
                    }
                } else {
                    if (!Array.isArray(obj[prop]) && typeof obj[prop] == "object" && typeof template[prop] == "object") {
                        for (p in template[prop]) {
                            if (p !== "shop") {
                                toTemplate(obj[prop], p, template[prop]);
                            }
                        }
                    }
                }
            };
            var removeInvalid = function(obj, prop, template) {
                var p;
                if (!(prop in template)) {
                    delete obj[prop];
                } else if (!Array.isArray(obj[prop]) && typeof obj[prop] == "object" && typeof template[prop] == "object") {
                    if (prop !== "shop") {
                        for (p in obj[prop]) {
                            removeInvalid(obj[prop], p, template[prop]);
                        }
                    }
                }
            };
            for (i in playerTemplate) {
                toTemplate(player, i, playerTemplate);
            }
            for (i in player) {
                removeInvalid(player, i, playerTemplate);
            }

            for (i = 0; i < allItems.length; i++) {
                clean = allItems[i];
                if (typeof player.balls[clean] !== "number") {
                    player.balls[clean] = parseInt(player.balls[clean], 10);
                }
                if (isNaN(player.balls[clean]) || player.balls[clean] === null || player.balls[clean] < 0) {
                    if (clean == "box") {
                        player.balls[clean] = 4;
                    } else {
                        player.balls[clean] = 0;
                    }
                }
                if (player.balls[clean] > itemCap) {
                    player.balls[clean] = itemCap;
                }
                if ((clean === "master" || clean === "stick") && player.balls[clean] > 1) {
                    player.balls[clean] = 1;
                }
            }

            if (typeof player.money !== "number") {
                player.money = parseInt(player.money, 10);
            }
            if (isNaN(player.money) || player.money < 0) {
                player.money = 0;
            } else if (player.money > moneyCap) {
                player.money = moneyCap;
            }
            if (player.money % 1 !== 0) {
                player.money = Math.floor(player.money);
            }
            if (player.altlog.length === 0) {
                player.altlog.push(player.id);
            }

            for (i = 0; i < allCostumes.length; i++) {
                clean = allCostumes[i];
                if (typeof player.costumes[clean] !== "number") {
                    player.costumes[clean] = 0;
                }
                if (player.costumes[clean] === undefined || isNaN(player.costumes[clean]) || player.costumes[clean] === null || player.costumes[clean] < 0) {
                    player.costumes[clean] = 0;
                }
                if (player.costumes[clean] > 1) {
                    player.costumes[clean] = 1;
                }
            }
            for (i in player.shop) {
                if (!player.shop[i].price) {
                    delete player.shop[i];
                }
            }
            if (!("idnum" in player) || player.idnum === undefined || player.idnum === null || isNaN(player.idnum) || player.idnum < 0 || typeof player.idnum !== "number") {
                player.idnum = 0;
                this.assignIdNumber(player);
            }

            this.saveGame(player);
        }
    };
    this.sanitizePokemon = function(player) {
        if (player) {
            var e, id, list = player.pokemon;
            for (e = list.length - 1; e >= 0; e--) {
                id = player.pokemon[e];
                if (!pokeInfo.valid(id)) {
                    list.splice(e, 1);
                }
            }
        }
    };
    this.flashPlayers = function() {
        var players = sys.playersOfChannel(safchan);
        for (var pid in players) {
            var player = getAvatar(players[pid]);
            if (player && player.flashme) {
                sys.sendHtmlMessage(players[pid], "<ping/>", safchan);
            }
        }
    };
    this.fullBoxWarning = function(src) {
        var player = getAvatar(src);
        if (player.pokemon.length >= player.balls.box * itemData.box.bonusRate - 5) {
            safaribot.sendMessage(src, "Your box is almost full! You can still catch " + (player.balls.box * itemData.box.bonusRate - player.pokemon.length) + " more Pokémon!", safchan);
        }
    };
    this.assignIdNumber = function(player, force) {
        if (!lastIdAssigned) {
            lastIdAssigned = loadLastId();
        }
        if (player) {
            if (!("idnum" in player) || player.idnum === undefined || player.idnum === null || isNaN(player.idnum) || player.idnum < 0 || typeof player.idnum !== "number") {
                player.idnum = 0;
            }
            if (player.idnum === 0 || force) {
                lastIdAssigned++;
                permObj.add("lastIdAssigned", lastIdAssigned);
                permObj.save();
                player.idnum = lastIdAssigned;
            }
        }
    };

    this.showHelp = function (src) {
        var x, help = [
            "",
            "*** *********************************************************************** ***",
            "±Goal: Use your Poké Balls to catch Wild Pokémon that appear during contest times.",
            //"±Goal: You can trade those Pokémon with other players or simply brag about your collection.",
            "±Goal: To start playing, type /start to choose your starter Pokémon and receive 30 Safari Balls.",
            "*** *********************************************************************** ***",
            //"±Contest: A contest starts every " + contestCooldownLength/60 + " minutes. During that time, wild Pokémon may suddenly appear.",
            "±Contest: When a wild Pokémon appears, players can use /catch to throw a ball until someone gets it.",
            "±Contest: Different balls can be used to get a better chance, but they also may have higher cooldown between throws or other effects.",
            "*** *********************************************************************** ***",
            "±Actions: Pokémon you caught can be sold to the NPC with /sell or traded with other players with /trade.",
            "±Actions: You can use the money gained by selling Pokémon and logging in everyday to /buy more Poké Balls.",
            //"±Actions: You can set up to 6 Pokémon to be visible to anyone. Form your party with /party, and view others' party with /view.",
            "±Actions: Use /party to form your party. This can give you a small bonus when trying to catch Pokémon based on type effectiveness and stats.",
            "*** *********************************************************************** ***",
            "±More: To learn other commands, use /commands safari.",
            "*** *********************************************************************** ***",
            ""
        ];
        for (x in help) {
            sys.sendMessage(src, help[x], safchan);
        }
    };
    this.showItemHelp = function (src, data) {
        if (data === "*") {
            safaribot.sendMessage(src, "You can use /itemhelp [item] to return information on a particular item, costume, or category. You can display the help for all items using \"/itemhelp all\" or from the following categories: \"balls\", \"items\", \"perks\".", safchan);
            return;
        }
        var help, help2;
        data = data.toLowerCase();
        var catStrings = ["all", "balls", "items", "perks", "costumes"];
        var itemHelp = {
            silver: "Rare coins that can be used to purchase valuable items. Obtained from quests and contests.",
            bait: "Tasty Bluk Berries used to attract wild Pokémon, set down with /bait. Has a " + itemData.bait.successRate*100 + "% success rate with an approximate " + itemData.bait.successCD + " second cooldown on success, and an approximate " + itemData.bait.failCD + " second cooldown on failure.",
            gacha: "A ticket that allows you to try the Gachapon Machine to get a random reward! Due to strict gambling regulations, there is a " + itemData.gacha.cooldown/1000 + " second delay between using the tickets.",
            //Seasonal change
            rock: "A small snowball that can be thrown to potentially freeze another player for a short period with /snowball. Has a " + itemData.rock.throwCD/1000 + " second cooldown.",
            rare: "Used to evolve Pokémon. Requires 2 Rare Candies to evolve into a final form Pokémon. Found with Itemfinder.",
            mega: "A mysterious stone that allows certain Pokémon to undergo a powerful transformation. It is said to wear off in approximately " + itemData.mega.duration + " days. Cannot be obtained through normal gameplay.",
            valuables: "The items Pearl, Stardust, Big Pearl, Star Piece, Nugget and Big Nugget can be pawned off with /pawn for a varying amount of money. Obtained from Gachapon, found with Itemfinder, and rewarded from Contests.",
            itemfinder: "Itemfinder: An experimental machine that can help find rare items! By default, it can only hold " + itemData.itemfinder.charges + " charges. These charges are reset every day.",
            gem: "An electrically charged gem created by a famous Ampharos in Olivine City. It is said to be able to recharge the Itemfinder, giving it " + itemData.gem.charges + " more uses for the day! (To use, type \"/use gem\"). Obtained from Gachapon.",
            box: "Increases number of Pokémon that can be owned by " + itemData.box.bonusRate + " each. Can only acquire by purchasing.",
            stick: "Legendary Stick of the almighty Farfetch'd that provides a never ending wave of prods and pokes (every " + itemData.stick.cooldown/1000 + " seconds) unto your enemies and other nefarious evil-doers, with a simple use of the /stick command.",
            salt: "A pile of salt that makes the holder increasingly unlucky the more they have.",
            entry: "A Raffle Entry that can win a wonderful prize if you own the correct one at the time of drawing."
        };
        var perkHelp = {
            amulet: "When holding this charm, " + itemData.amulet.bonusRate * 100 + "% more money is obtained when selling a Pokémon to the store (Max Rate: " + itemData.amulet.maxRate * 100 + "%). Obtained from Gachapon.",
            soothe: "A bell with a comforting chime that calms the owner and their Pokémon. Reduces delay after a successful catch by " + itemData.soothe.bonusRate * 100 + "% (Max Rate: " + itemData.soothe.maxRate * 100 + "%). Obtained from Gachapon.",
            scarf: "A fashionable scarf made of the finest silk. Wearing it allows you to lead a more luxurious life and grants you " + itemData.scarf.bonusRate * 100 + "% more money from Luxury Balls (Max Rate: " + itemData.scarf.maxRate * 100 + "%). Obtained from Gachapon.",
            battery: " A high-capacity battery that can increase the uses of Item Finder by " + itemData.battery.bonusRate + " per day. (Max Rate: " + itemData.battery.maxRate + "). Obtained from Gachapon.",
            honey: "Sweet-smelling Combee Honey that, when applied to bait, increases the chance of a Pokémon being attracted by " + itemData.honey.bonusRate * 100 + "% (Max Rate: " + itemData.honey.maxRate * 100 + "%). Found with Itemfinder.",
            crown: "A rare crown with mysterious properties that brings good fortune to its owner. Increases rate of pawned items by " + itemData.crown.bonusRate * 100 + "% (Max Rate: " + itemData.crown.maxRate * 100 + "%). Found with Itemfinder.",
            eviolite: "A mysterious gem that automatically powers up Pokémon with 420 BST or less by " + itemData.eviolite.bonusRate + ". (Max Rate: " + itemData.eviolite.maxRate + "). Found with Itemfinder."
        };
        var ballHelp = {
            safari: "A standard issue Poké Ball used to catch Pokémon. Has a cooldown of " + itemData.safari.cooldown / 1000 +" seconds.",
            great: "A Poké Ball that has a slightly increased catch rate. Has a cooldown of " + itemData.great.cooldown / 1000 +" seconds.",
            ultra: "A high functioning Poké Ball that has a better catch rate than a Great Ball. Has a cooldown of " + itemData.ultra.cooldown / 1000 +" seconds.",
            master: "An extremely rare Poké Ball that never fails to catch. Has a cooldown of " + itemData.master.cooldown / 1000 +" seconds. It is said to be a rare prize in Gachapon.",
            premier: "A plain Poké Ball gifted to you for your patronage. It works better when a Normal-type Pokémon is active. Has a cooldown of " + itemData.premier.cooldown / 1000 +" seconds. Obtained by purchasing a lot of Poké Balls from the shop.",
            luxury: "A comfortable Poké Ball with an increased catch rate that is said to make one wealthy. Has a cooldown of " + itemData.luxury.cooldown / 1000 +" seconds. Obtained from Gachapon and found with Itemfinder.",
            myth: "An alternate colored Poké Ball that works better on really rare Pokémon. Has a cooldown of " + itemData.myth.cooldown / 1000 +" seconds. Obtained from Gachapon.",
            quick: "A somewhat different Poké Ball that tends to get better priority during throws. Has a cooldown of " + itemData.quick.cooldown / 1000 +" seconds. Obtained from Gachapon.",
            heavy: "An industrial Poké Ball that works better against hardier and stronger Pokémon. Has a cooldown of " + itemData.heavy.cooldown / 1000 +" seconds. Obtained from Gachapon.",
            clone: "A mysterious Poké Ball with a very low catch rate that can duplicate a pokémon's D.N.A.. Has a cooldown of " + itemData.clone.cooldown / 1000 +" seconds. Obtained from Gachapon.",
            spy: "A stealthy Poké Ball that cannot be tracked. Has a cooldown of " + itemData.spy.cooldown / 1000 +" seconds. Found with Itemfinder."
        };
        /*var costumeHelp = {
            inver: costumeData.inver.effect,
            breeder: costumeData.breeder.effect,
            scientist: costumeData.scientist.effect,
            ace: costumeData.ace.effect,
            tech: costumeData.tech.effect,
            aroma: costumeData.aroma.effect,
            chef: costumeData.chef.effect,
            explorer: costumeData.explorer.effect,
            fisher: costumeData.fisher.effect
        };*/

        if (catStrings.indexOf(data) === -1) {
            //Try to decode which item the user is looking for
            var lookup = itemAlias(data, true);
            if (allItems.indexOf(lookup) !== -1) {
                //Now grab the help from whichever category it is
                if (itemHelp.hasOwnProperty(lookup)) {
                    help = finishName(lookup) + ": " + itemHelp[lookup];
                } else if (itemData[lookup].type == "valuables") {
                    lookup = "valuables";
                    help = finishName(lookup) + ": " + itemHelp[lookup];
                } else if (perkHelp.hasOwnProperty(lookup)) {
                    help = finishName(lookup) + ": " + perkHelp[lookup];
                    help2 = "Note: This item is a Perk and the effects are passive.";
                } else if (ballHelp.hasOwnProperty(lookup)) {
                    help = finishName(lookup) + ": " + ballHelp[lookup];
                    help2 = "Note: Cooldown value doubles following a successful catch.";
                }
            } /*else {
                //If it's not an item, it's either a costume or invalid.
                lookup = costumeAlias(data, true);
                if (allCostumes.indexOf(lookup) !== -1) {
                    if (costumeHelp.hasOwnProperty(lookup)) {
                        help = costumeAlias(lookup, false, true) + " Costume: " + costumeHelp[lookup];
                    }
                }
            }*/

            //Frame out result
            if (!help) {
                safaribot.sendMessage(src, lookup + " is either an invalid item or no help string is defined!", safchan);
                return;
            }
            sys.sendMessage(src, "", safchan);
            sys.sendMessage(src, "*** Item Help ***", safchan);
            sys.sendMessage(src, help, safchan);
            if (help2) {
                sys.sendMessage(src, help2, safchan);
            }
            sys.sendMessage(src, "", safchan);
        } else {
            var x, dataArray, out = [];
            out.push("");
            if (data === "all" || data === "items") {
                out.push("*** Item Help ***");
                dataArray = Object.keys(itemHelp);
                for (var e in dataArray) {
                    e = dataArray[e];
                    out.push(finishName(e) + ": " + itemHelp[e]);
                }
                out.push("");
            }
            if (data === "all" || data === "balls") {
                out.push("*** Ball Help ***");
                dataArray = Object.keys(ballHelp);
                for (var e in dataArray) {
                    e = dataArray[e];
                    out.push(finishName(e)  + ": " + ballHelp[e]);
                }
                out.push("Note: Cooldown value doubles following a successful catch.");
                out.push("");
            }
            if (data === "all" || data === "perks") {
                out.push("*** Perk Help ***");
                dataArray = Object.keys(perkHelp);
                for (var e in dataArray) {
                    e = dataArray[e];
                    out.push(finishName(e)  + ": " + perkHelp[e]);
                }
                out.push("Note: These items are Perks and the effects are passive.");
                out.push("");
            }
            /*if (data === "all" || data === "costumes") {
                out.push("*** Costume Help ***");
                dataArray = Object.keys(costumeHelp);
                for (var e in dataArray) {
                    e = dataArray[e];
                    out.push(costumeAlias(e, false, true) + " Costume: " + costumeHelp[e]);
                }
                out.push("");
            }*/
            for (x in out) {
                sys.sendMessage(src, out[x], safchan);
            }
        }
    };
    this.onHelp = function (src, topic, channel) {
        if (topic === "safari") {
            safari.showCommands(src, channel);
            return true;
        }
        return false;
    };
    this.showCommands = function (src, channel) {
        var userHelp = [
            "",
            "*** Safari Commands ***",
            "/help: For a how-to-play guide.",
            "/itemhelp [item or category]: Returns information on a particular item, costume, or category. You can display the help for all items using \"/itemhelp all\" or from the following categories: \"balls\", \"items\", \"perks\".",
            "/start: To pick a starter Pokémon and join the Safari game. Valid starters are Bulbasaur, Charmander, and Squirtle.",
            "/catch [ball]: To throw a Safari Ball when a wild Pokémon appears. [ball] can be replaced with the name of any other ball you possess.",
            "/sell: To sell one of your Pokémon*.",
            "/pawn: To sell specific items.",
            "/trade: To request a Pokémon trade with another player*. Use $200 to trade money and @luxury to trade items (use 3@luxury to trade more than 1 of that item).",
            // "/release: Used to release a Pokémon that can be caught by other players*. Pokémon can only be released every 3 minutes.",
            "/buy: To buy items or Pokémon.",
            "/shop: To buy items or Pokémon from a another player.",
            "/shopadd: To add items or Pokémon to your personal shop. Use /shopremove to something from your shop, /shopclose to remove all items at once or /shopclean to remove all items out of stock.",
            "/auction: To start an auction.",
            // "/buycostume: To buy a new costume.",
            "/party: To add or remove a Pokémon from your party, set your party's leader*, or load a previously saved party. Type /party for more details.",
            "/quest: To view available quests.",
            "/box [number]: To view all your caught Pokémon organized in boxes. Use /boxt for a text-only version.",
            "/bag: To view all money and items. Use /bagt for a text-only version.",
            //"/costumes: To view your current costumes.",
            //"/changecostume [name]: To change your costume to a new one.",
            "/view: To view another player's party. If no player is specified, all of your data will show up. You can also use /view on or /view off to enable/disable others from viewing your party. Use /viewt for a text-only version of your data (excluding party).",
            "/challenge: To challenge another player to a battle.",
            "/watch: To watch someone else's battle.",
            "/changealt: To pass your Safari data to another alt.",
            "/bait: To throw bait in the attempt to lure a Wild Pokémon. Specify a ball type to throw that first.",
            "/rarecandy: Use a Rare Candy to evolve a Pokémon*.",
            "/megastone: Use a Mega Stone to mega evolve a Pokémon*.",
            "/gacha: Use a ticket to win a prize!",
            "/finder: Use your item finder to look for items.",
            //seasonal change
            "/snowball: To throw a snowball at another player.",
            "/stick: To poke another player with your stick.",
            "/use: To use a consumable item.",
            "/find [criteria] [value]: To find Pokémon that you have that fit that criteria. Type /find for more details. Use /findt for a text-only version.",
            "/sort [criteria] [ascending|descending]: To sort the order in which the Pokémon are listed on /mydata. Criteria are Alphabetical, Number, BST, Type and Duplicate.",
            "/bst [pokémon]: To view the BST of a Pokémon and price you can sell a Pokémon.",
            "/info: View global information like time until next contest, contest's theme, current Gachapon jackpot prize.",
            "/leaderboard [type]: View the Safari Leaderboards. Type \"/leaderboard list\" to see all existing leaderboards.",
            "/flashme: Toggle whether or not you get flashed when a contest starts.",
            "/themes: View available contest themes.",
            "",
            "*: Add an * to a Pokémon's name to indicate a shiny Pokémon."
        ];
        var help = userHelp;
        var adminHelp = [
            "*** Safari Warden Commands ***",
            "/sanitize [player]: Removes invalid values from the target's inventory, such as NaN and undefined. Use /sanitizeall to sanitize everyone in the channel at once.",
            "/tradelog [amount]։[lookup]: Returns a list of recent trades. Defaults to 10. Amount can be changed to return that number of logs. Lookup will only return logs with the specified value in the past amount of logs. Use /shoplog for shops or /auctionlog for auctions.",
            "/lostlog [amount]։[lookup]: Returns a list of recent commands that lead to a Pokémon being lost (sell, quests, etc). Amount and Lookup works the same as /tradelog.",
            "/altlog [amount]։[lookup]: Returns a list Safari save transfers. Amount and Lookup works the same as /tradelog.",
            "/tradeban: Bans a player from trading or using their shop. Use /tradeban [player]:[length]. USe -1 for length to denote permanent, 0 for length to unban.",
            "/tradebans: To view players currently tradebanned.",
            "/analyze [player]։[lookup]: Returns the value of a specified property relating to a person's save. Lookup follows object notation, leave blank to return the entire save's data.",
            "/track [player]: Adds a tracker to a player that sends a message every time they attempt to bait and throw a ball. Useful to catch botters.",
            "/trick [player]։[pokemon]։[message]: Sends the designated player a fake wild Pokemon. Pokemon is optional, defaults to random. Message is an optional message such as \"Don't throw!\", defaults to nothing."
        ];
        var ownerHelp = [
            "*** Safari Owner Commands ***",
            "/contest[soft]: Force starts a Safari contest. Use /contestsoft to skip broadcasting to Tohjo Falls.",
            "/wild[event] [pokemon (optional)]: Spawns a random or designated wild Pokemon with no restrictions. Use /wildevent for a spawn that cannot be caught with Master Balls.",
            "/horde: Spawns a group of random wild Pokemon with no restrictions. Use a valid dex number to spawn a specific Pokemon.",
            "/checkrate [item]: Displays the rate of obtaining that item from Gachapon and Itemfinder.",
            "/safaripay [player]։[amount]: Awards a player with the specified amount of money.",
            "/safarigift [player/player names]։[item]։[amount]: Gifts a player with any amount of an item or ball. You can send to multiple players at once if you separate each name with a comma or a comma and a space.",
            "/bestow [player]։[pokemon]: Gifts a player a specific Pokemon.",
            "/forgerecord [player]։[record]։[amount]: Alters a specific record of a player.",
            "/wipesafari [player]: Wipes the targeted player's safari. Irreversable-ish.",
            "/loadsafari [JSON]: Creates a safari save with the specified JSON code. ",
            "/findsaves: Lists all saves the Safari Game currently has data on.",
            "/scare: Scares the wild Pokemon away. Use /glare for a silent action.",
            "/npc[add/remove] [item/pokemon]։[price]։[limit]: Adds or removes an item to the NPC shop with the provided arguments. Use /npcclose to clear the NPC shop or /npcclean to remove items out of stock."
        ];
        if (SESSION.channels(safchan).isChannelAdmin(src)) {
            help.push.apply(help, adminHelp);
        }
        if (SESSION.channels(safchan).isChannelOwner(src)) {
            help.push.apply(help, ownerHelp);
        }
        for (var x = 0; x < help.length; x++) {
            sys.sendMessage(src, help[x], channel);
        }
    };
    this["help-string"] = ["safari: To know the safari commands"];

    this.handleCommand = function (src, message, channel) {
        var command;
        var commandData = "*";
        var pos = message.indexOf(' ');
        if (pos !== -1) {
            command = message.substring(0, pos).toLowerCase();
            commandData = message.substr(pos + 1);
        }
        else {
            command = message.substr(0).toLowerCase();
        }
        if (channel !== safchan && [].indexOf(command) === -1) {
            return false;
        }
        if (SESSION.channels(safchan).muteall && !SESSION.channels(safchan).isChannelOwner(src)) {
            safaribot.sendMessage(src, "You can't play Safari while the channel is silenced.", safchan);
            return true;
        }
        
        //User commands
        if (!safariUpdating || SESSION.channels(safchan).isChannelOwner(src)) {
            if (command === "help") {
                safari.showHelp(src);
                return true;
            }
            if (command === "itemhelp") {
                safari.showItemHelp(src, commandData);
                return true;
            }
            if (command === "start") {
                safari.startGame(src, commandData);
                return true;
            }
            if (command === "catch" || command === "throw") {
                safari.throwBall(src, commandData);
                return true;
            }
            if (command === "sell") {
                safari.sellPokemon(src, commandData);
                return true;
            }
            if (command === "buy") {
                safari.buyFromShop(src, ":" + commandData, command, true);
                return true;
            }
            if (command === "buycostume") {
                safari.buyCostumes(src, commandData);
                return true;
            }
            if (command === "shop") {
                safari.buyFromShop(src, commandData, command);
                return true;
            }
            var shopCommands = ["shopadd", "addshop", "shopremove", "removeshop", "closeshop", "shopclose", "cleanshop", "shopclean"];
            if (shopCommands.contains(command)) {
                var action = "remove";
                switch (command) {
                    case "shopadd":
                    case "addshop":
                        action = "add";
                        break;
                    case "shopclose":
                    case "closeshop":
                        action = "close";
                        break;
                    case "shopclean":
                    case "cleanshop":
                        action = "clean";
                        break;
                    case "shopremove":
                    case "removeshop":
                        action = "remove";
                        break;
                }
                safari.editShop(src, action + ":" + commandData);
                return true;
            }
            if (command === "pawn") {
                safari.sellItems(src, commandData);
                return true;
            }
            if (command === "trade") {
                safari.tradePokemon(src, commandData);
                return true;
            }
            if (command === "auction") {
                safari.createAuction(src, commandData);
                return true;
            }
            if (command === "join") {
                safari.joinAuction(src, commandData);
                return true;
            }
            if (command === "bid") {
                safari.bidAuction(src, commandData);
                return true;
            }
            if (command === "leave") {
                safari.quitAuction(src, commandData);
                return true;
            }
            if (command === "party") {
                safari.manageParty(src, commandData);
                return true;
            }
            if (command === "add") {
                safari.manageParty(src, "add:" + commandData);
                return true;
            }
            if (command === "remove") {
                safari.manageParty(src, "remove:" + commandData);
                return true;
            }
            if (command === "active") {
                safari.manageParty(src, "active:" + commandData);
                return true;
            }
            if (command === "view" || command === "mydata" || command === "viewt" || command === "mydatat") {
                if (command !== "view" || commandData === "*") {
                    safari.viewOwnInfo(src, (command === "viewt" || command === "mydatat"));
                } else {
                    safari.viewPlayer(src, commandData);
                }
                return true;
            }
            if (command === "bag" || command === "bagt") {
                safari.viewItems(src, command === "bagt");
                return true;
            }
            if (command === "box" || command === "boxt") {
                safari.viewBox(src, commandData, command === "boxt");
                return true;
            }
            /*if (command === "costumes") {
                safari.viewCostumes(src);
                return true;
            }
            if (command === "dressup" || command === "changecostume") {
                safari.changeCostume(src, commandData);
                return true;
            }*/
            if (command === "changealt") {
                safari.changeAlt(src, commandData);
                return true;
            }
            if (command === "bait") {
                safari.throwBait(src, commandData);
                return true;
            }
            if (command === "rock" || command === "snowball" || command === "snow") {
                safari.throwRock(src, commandData);
                return true;
            }
            if (command === "stick") {
                safari.useStick(src, commandData);
                return true;
            }
            if (command === "gacha") {
                safari.gachapon(src, commandData);
                return true;
            }
            if (command === "rare" || command === "rarecandy") {
                safari.useRareCandy(src, commandData);
                return true;
            }
            if (command === "mega" || command === "megastone") {
                safari.useMegaStone(src, commandData);
                return true;
            }
            if (command === "challenge") {
                safari.challengePlayer(src, commandData);
                return true;
            }
            if (command === "watch") {
                safari.watchBattle(src, commandData);
                return true;
            }
            if (command === "quest") {
                safari.questNPC(src, commandData);
                return true;
            }
            if (command === "sort") {
                safari.sortBox(src, commandData);
                return true;
            }
            if (command === "find") {
                safari.findPokemon(src, commandData);
                return true;
            }
            if (command === "findt") {
                safari.findPokemon(src, commandData, true);
                return true;
            }
            if (command === "leaderboard" || command == "lb") {
                var rec = commandData.toLowerCase(), e;

                if (rec === "list") {
                    sys.sendMessage(src, "", safchan);
                    safaribot.sendMessage(src, "Existing leaderboards (type /lb [type] for the list): ", safchan);
                    for (e in leaderboardTypes) {
                        safaribot.sendHtmlMessage(src, "<a href='po:send//lb " + leaderboardTypes[e].alias + "'>" + cap(leaderboardTypes[e].alias) + "</a> : Leaderboard " + leaderboardTypes[e].desc, safchan);
                    }
                    sys.sendMessage(src, "", safchan);
                    return true;
                }
                
                var info = rec.split(":");
                rec = info[0];

                var lbKeys = Object.keys(leaderboardTypes);
                var lowCaseKeys = lbKeys.map(function(x) { return x.toLowerCase(); });
                if (lowCaseKeys.indexOf(rec) !== -1) {
                    rec = lbKeys[lowCaseKeys.indexOf(rec)];
                } else {
                    var found = false;
                    for (e in leaderboardTypes) {
                        if (leaderboardTypes[e].alts.indexOf(rec) !== -1) {
                            rec = e;
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        rec = "totalPokes";
                    }
                }
                
                var range = info.length > 1 ? getRange(info[1]) : { lower: 1, upper: 10 };
                var self = sys.name(src).toLowerCase();
                if (!range) {
                    range = { lower: 1, upper: 10 };
                    if (info.length > 1) {
                        self = info[1].toLowerCase();
                    }
                }
                var list = getArrayRange(leaderboards[rec], range.lower, range.upper);
                var out = ["", "<b>Safari Leaderboards " + leaderboardTypes[rec].desc + "</b>" + (lastLeaderboardUpdate ? " (last updated: " + lastLeaderboardUpdate + ")" : "")], selfFound = false;
                var sign = (leaderboardTypes[rec].isMoney ? "$" : "");
                for (e = 0; e < list.length; e++) {
                    out.push("<b>" + (range.lower + e) + ".</b> " + list[e].name + ": " + sign + addComma(list[e].value));
                    if (list[e].name == self) {
                        selfFound = true;
                    }
                }
                if (!selfFound) {
                    list = leaderboards[rec];
                    for (e = 0; e < list.length; e++) {
                        if (list[e].name == self) {
                            var entry = "<b>" + (e + 1) + ".</b> " + list[e].name + ": " + sign + addComma(list[e].value);
                            if (e < range.lower) {
                                out.splice(2, 0, entry);
                            } else {
                                out.push(entry);
                            }
                            selfFound = true;
                            break;
                        }
                    }
                    if (!selfFound) {
                        out.push((self == sys.name(src).toLowerCase() ? "You are" : self.toCorrectCase() + " is" ) + " not ranked in this leaderboard!");
                    }
                }
                out.push("");
                sys.sendHtmlMessage(src, out.join("<br/>"),safchan);
                return true;
            }
            if (command === "flashme") {
                if (!validPlayers("self", src)) {
                    return;
                }
                var player = getAvatar(src);
                if (!player.flashme) {
                    player.flashme = true;
                    safaribot.sendMessage(src, "You will now be flashed when a contest starts!", safchan);
                }
                else {
                    delete player.flashme;
                    safaribot.sendMessage(src, "You will no longer be flashed when a contest starts!", safchan);
                }
                safari.saveGame(player);
                return true;
            }
            if (command === "safarirules") {
                script.beforeChatMessage(src, "/crules", safchan);
                return true;
            }
            if (command === "info") {
                var time = new Date(now()).toUTCString();
                sys.sendMessage(src, "*** *********************************************************************** ***", safchan);
                safaribot.sendMessage(src, "Current Time: " + time, safchan);
                if (contestCount > 0) {
                    var min = Math.floor(contestCount/60);
                    var sec = contestCount%60;
                    safaribot.sendMessage(src, "Current Contest's theme: " + (currentTheme ? contestThemes[currentTheme].name : "Default") + ".", safchan);
                    if (currentRules) {
                        safaribot.sendMessage(src, "Contest's Rules: " + this.translateRules(currentRules), safchan);
                    }
                    safaribot.sendMessage(src, "Time until the Contest ends: " + min + " minutes, " + sec + " seconds.", safchan);
                } else {
                    var min = Math.floor(contestCooldown/60);
                    var sec = contestCooldown%60;
                    safaribot.sendMessage(src, "Time until next Contest: " + min + " minutes, " + sec + " seconds.", safchan);
                    if (nextTheme) {
                        safaribot.sendMessage(src, "Next Contest's theme: " + (nextTheme !== "none" ? themeName(nextTheme) : "Default") + ".", safchan);

                        if (Array.isArray(nextTheme) && nextRules) { //Disabled for now
                            var t, n;

                            for (n = 0; n < nextTheme.length; n++) {
                                t = nextTheme[n];
                                if (nextRules && t in nextRules) {
                                    safaribot.sendMessage(src, "--- Rules for " + themeName(t) + ": " + this.translateRules(nextRules[t]), safchan);
                                }
                            }
                        }
                    }
                }
                safaribot.sendMessage(src, "Boost-of-the-Day: " + sys.pokemon(dailyBoost.pokemon) + " (" + dailyBoost.bonus.toFixed(2) + "x catch rate if used as active).", safchan);
                safaribot.sendMessage(src, "Current Gachapon Jackpot: " + Math.floor(gachaJackpot/10) + " Tickets.", safchan);
                sys.sendMessage(src, "*** *********************************************************************** ***", safchan);
                return true;
            }
            if (command === "bst") {
                var info = getInputPokemon(commandData);

                if (!info.num) {
                    safaribot.sendMessage(src, "Invalid Pokémon.", safchan);
                    return true;
                }

                sys.sendMessage(src, "", safchan);
                safaribot.sendMessage(src, info.name + "'s BST is " + getBST(info.num) + ".", safchan);
                var player = getAvatar(src);
                if (player) {
                    if (isMega(info.num)) {
                        safaribot.sendMessage(src, info.name + " cannot be sold.", safchan);
                    } else {
                        var perkBonus = 1 + Math.min(itemData.amulet.bonusRate * player.balls.amulet, itemData.amulet.maxRate);
                        var price = getPrice(info.num, info.shiny, perkBonus);
                        safaribot.sendMessage(src, "You can sell a " + info.name + " for $" + addComma(price) + ". " + (!info.shiny ? "If it's Shiny, you can sell it for $" + addComma(getPrice(info.num, true, perkBonus))  + ". " : ""), safchan);
                    }
                }
                var species = pokeInfo.species(info.num);
                if (species in evolutions) {
                    var evoData = evolutions[species];
                    var candiesRequired = evoData.candies || 2;
                    var evo = evoData.evo;
                    safaribot.sendMessage(src, info.name + " requires " + candiesRequired + " Rare Cand" + (candiesRequired == 1 ? "y" : "ies") + " to evolve into " + (Array.isArray(evo) ? readable(evo.map(poke), "or") : poke(evo)) + ". ", safchan);
                }
                if (!isMega(info.num) && species in megaEvolutions) {
                    safaribot.sendMessage(src, info.name + " can mega evolve into " + readable(megaEvolutions[species].map(poke), "or") + ". ", safchan);
                }
                if (isLegendary(info.num)) {
                    var themes = [];
                    for (var e in contestThemes) {
                        if (this.validForTheme(info.num, e)) {
                            themes.push(contestThemes[e].name);
                        }
                    }
                    if (themes.length > 0) {
                        safaribot.sendMessage(src, info.name + " can be found in the following theme: " + readable(themes, "and") + ".", safchan);
                    } else {
                        safaribot.sendMessage(src, info.name + " cannot be found in any theme currently.", safchan);
                    }
                }
                sys.sendMessage(src, "", safchan);
                return true;
            }
            /* if (command === "release") {
                safari.releasePokemon(src, commandData);
                return true;
            } */
            if (command === "records") {
                safari.showRecords(src);
                return true;
            }
            if (command === "itemfinder" || command === "finder") {
                safari.findItem(src);
                return true;
            }
            if (command === "use") {
                safari.useItem(src, commandData);
                return true;
            }
            if (command === "themes") {
                var ret = [];
                var contests = Object.keys(contestThemes);
                for (var e in contests) {
                    ret.push(contestThemes[contests[e]].name);
                }
                ret.sort();
                safaribot.sendMessage(src, "Available Contest Themes: " + readable(ret, "and") + ".", safchan);
                return true;
            }
        } else {
            safaribot.sendMessage(src, "You can't play Safari while it is updating.", safchan);
            return true;
        }

        //Staff Commands
        if (!SESSION.channels(safchan).isChannelOperator(src)) {
            return false;
        }
        
        if (!SESSION.channels(safchan).isChannelAdmin(src)) {
            return false;
        }
        if (command === "sanitize") {
            var playerId = sys.id(commandData);
            if (!playerId) {
                safaribot.sendMessage(src, "No such person!", safchan);
                return true;
            }

            var player = getAvatar(playerId);
            if (player) {
                safari.sanitize(player);
                safari.sanitizePokemon(player);
                safaribot.sendMessage(src, commandData + "'s safari has been sanitized of invalid values!", safchan);
                safaribot.sendMessage(playerId, "Your Safari has been sanitized of invalid values!", safchan);
            } else {
                safaribot.sendMessage(src, "No such person!", safchan);
            }
            return true;
        }
        if (command === "sanitizeall") {
            var onChannel = sys.playersOfChannel(safchan);
            var player;
            for (var e in onChannel) {
                player = getAvatar(onChannel[e]);
                if (!player) {
                    continue;
                }
                safari.sanitize(player);
                safari.sanitizePokemon(player);
            }
            safaribot.sendAll("All safaris have been sanitized!", safchan);
            return true;
        }
        if (command === "track") {
            var target = getAvatarOff(commandData);

            if (!target) {
                safaribot.sendMessage(src, "No such player!", safchan);
                return true;
            }
            var name = sys.name(src).toLowerCase();
            if (target.trackers.contains(name)) {
                target.trackers.splice(target.trackers.indexOf(name), 1);
                safari.saveGame(target);
                safaribot.sendMessage(src, "No longer tracking " + commandData.toCorrectCase() + "!", safchan);
            } else {
                target.trackers.push(name);
                safari.saveGame(target);
                safaribot.sendMessage(src, "Now tracking " + commandData.toCorrectCase() + "!", safchan);
            }
            return true;
        }
        if (command === "trick") {
            var info = commandData.split(":");
            var targetId = sys.id(info[0]);
            if (!targetId || !sys.isInChannel(targetId, safchan)) {
                safaribot.sendMessage(src, "No such person in the channel!", safchan);
                return true;
            }
            var input;
            if (info.length > 1) {
                input = getInputPokemon(info[1]);
            }
            if (!input || !input.num) {
                input = getInputPokemon(sys.rand(1, 722) + "");
            }

            safaribot.sendMessage(src, "Tricking " + sys.name(targetId) + " into seeing a wild " + input.name + "!", safchan);
            sys.sendHtmlMessage(targetId, "<hr><center>" + (input.shiny ? "<font color='DarkOrchid'>" : "") + "A wild " + input.name + " appeared! <i>(BST: " + getBST(input.num) + ")</i>" + (input.shiny ? "</font>" : "") + "<br/>" + pokeInfo.sprite(input.id) + "</center><hr>", safchan);
            ballMacro(targetId);
            if (info.length > 2) {
                sys.sendMessage(targetId, info.slice(2).join(":"), safchan);
            }
            lastWild = now();

            return true;
        }
        if (command === "tradeban") {
            var info = commandData.split(":");
            var name = info[0];
            if (info.length < 2) {
                safaribot.sendMessage(src, "Please set a duration!", safchan);
                return true;
            }

            var duration = info[1];
            if (duration != -1) {
                duration = utilities.getSeconds(info[1]);
            }
            var player = getAvatarOff(name);
            if (!player) {
                safaribot.sendMessage(src, "No such player!", safchan);
                return true;
            }
            if (duration === 0) {
                player.tradeban = 0;
                safaribot.sendAll(name + " has been unbanned from trading and shopping!", safchan);
                safaribot.sendAll(name + " has been unbanned from trading and shopping!", staffchannel);
                safari.saveGame(player);
                tradeBans.remove(player.id);
            } else {
                var length;
                if (duration == -1) {
                    length = "permanently";
                    player.tradeban = 2147483000000;
                } else {
                    length = "for " + utilities.getTimeString(duration);
                    player.tradeban = now() + duration * 1000;
                }
                player.shop = {};
                safari.saveGame(player);
                safaribot.sendAll(name + " has been banned from trading and shopping " + length + "!", safchan);
                safaribot.sendAll(name + " has been banned from trading and shopping " + length + "!", staffchannel);
                tradeBans.add(player.id, player.tradeban);
            }
            return true;
        }
        if (command === "tradebans") {
            if (tradeBans) {
                var out = [], val, currentTime = now();
                for (var b in tradeBans.hash) {
                    val = parseInt(tradeBans.hash[b], 10);
                    if (val > currentTime) {
                        out.push(b.toCorrectCase() + " is tradebanned until " + (new Date(val).toUTCString()) + ".");
                    } else if (val == -1) {
                        out.push(b.toCorrectCase() + " is permanently tradebanned.");
                    }
                }
                if (out.length > 0) {
                    sys.sendMessage(src, "", safchan);
                    sys.sendMessage(src, "*** SAFARI TRADE BANS ***", safchan);
                    for (b = 0; b < out.length; b++) {
                        safaribot.sendMessage(src, out[b], safchan);
                    }
                    sys.sendMessage(src, "", safchan);
                } else {
                    safaribot.sendMessage(src, "No one is currently tradebanned!", safchan);
                }
            } else {
                safaribot.sendMessage(src, "Trade Bans file not found!", safchan);
            }
            return true;
        }
        if (command === "analyze") {
            var info = commandData.split(":");
            var target = sys.id(info[0]);
            var player = getAvatarOff(info[0]);
            if (!player) {
                safaribot.sendMessage(src, "This person doesn't have a Safari save!", safchan);
                return true;
            }
            var prop = (info.length < 2) ? [] : info[1].split(".");
            var attr = player[prop[0]];
            var propName = ["safari"];
            if (prop.length == 1 && prop[0] === "") {
                attr = player;
            } else {
                if (!attr) {
                    attr = player;
                }
                propName.push(prop[0]);
                for (var e = 1; e < prop.length; e++) {
                    propName.push(prop[e]);
                    if (prop[e] in attr) {
                        attr = attr[prop[e]];
                    } else {
                        safaribot.sendMessage(src, "This player does not have a '" + propName.join(".") + "' property!", safchan);
                        return true;
                    }
                }
            }

            safaribot.sendMessage(src, (target ? sys.name(target) : player.id) + "." + propName.join(".") + ": " + JSON.stringify(attr), safchan);
            return true;
        }
        if (command === "tradelog") {
            safari.showLog(src, commandData, tradeLog, "trade", function(x) {
                var info = x.split("|||");
                var time = new Date(parseInt(info[0], 10)).toUTCString();
                var p1 = info[1].split("::")[0];
                var p1offer = info[1].split("::")[1];
                var p2 = info[2].split("::")[0];
                var p2offer = info[2].split("::")[1];

                return p1 + "'s " + p1offer + " <--> " + p2 + "'s " + p2offer + " - (" + time + ")";
            });
            return true;
        }
        if (command === "shoplog") {
            safari.showLog(src, commandData, shopLog, "shop", function(x) {
                var info = x.split("|||");
                var time = new Date(parseInt(info[0], 10)).toUTCString();
                var p1Info = info[1].split("::");
                var p1 = p1Info[0];
                var amount = parseInt(p1Info[1], 10);
                var item = p1Info[2];
                var price = parseInt(p1Info[3], 10);
                var cost = parseInt(p1Info[4], 10);
                var p2 = info[2].split("::")[0];

                return p2 + " bought " + amount + "x " + item + " from " + p1 + " for $" + addComma(cost) + (amount > 1 ? " ($" + addComma(price) + " each)" : "") + " --- (" + time + ")";
            });
            return true;
        }
        if (command === "auctionlog") {
            safari.showLog(src, commandData, auctionLog, "auction", function(x) {
                var info = x.split("|||");
                var time = new Date(parseInt(info[0], 10)).toUTCString();
                var p1Info = info[1].split("::");
                var p1 = p1Info[0];
                var amount = parseInt(p1Info[1], 10);
                var item = p1Info[2];
                var price = parseInt(p1Info[3], 10);
                var p2 = info[2].split("::")[0];

                return p2 + " won " + p1 + "'s auction for " + amount + "x " + item + " by paying $" + addComma(price) + " --- (" + time + ")";
            });
            return true;
        }
        if (command === "altlog") {
            safari.showLog(src, commandData, altLog, "alt Change", function(x) {
                var info = x.split("|||");
                var time = new Date(parseInt(info[0], 10)).toUTCString();
                
                var transfer = info[1].split("::");
                var user = info[2];

                return transfer + " --- (by " + user + " at " + time + ")";
            });
            return true;
        }
        if (command === "lostlog") {
            safari.showLog(src, commandData, lostLog, "lost Pokémon", function(x) {
                var info = x.split("|||");
                var time = new Date(parseInt(info[0], 10)).toUTCString();
                
                var p1Info = info[1].split("::");
                var user = p1Info[0];
                var comm = p1Info[1];
                var extra = p1Info[2];
                
                return user + " used /" + comm + (extra == "." ? "" : " [" + extra + "]") + " --- (" + time + ")";
            });
            return true;
        }
        
        if (!SESSION.channels(safchan).isChannelOwner(src)) {
            return false;
        }
        var shopCommands = ["npcadd", "addnpc", "npcremove", "removenpc", "closenpc", "npcclose", "npcclean", "cleannpc", "silveradd", "addsilver"];
        if (shopCommands.contains(command)) {
            var action = "remove";
            var isSilver = false;
            switch (command) {
                case "npcadd":
                case "addnpc":
                    action = "add";
                    break;
                case "silveradd":
                case "addsilver":
                    action = "add";
                    isSilver = true;
                    break;
                case "closenpc":
                case "npcclose":
                    action = "close";
                    break;
                case "cleannpc":
                case "npcclean":
                    action = "clean";
                    break;
                case "npcremove":
                case "removenpc":
                    action = "remove";
                    break;
            }
            safari.editShop(src, action + ":" + commandData, true, isSilver);
            return true;
        }
        if (command === "checkrate") {
            commandData = commandData.toLowerCase();
            if (allItems.indexOf(commandData) !== -1 || commandData === "wild" || commandData === "horde" || commandData === "nothing" || commandData === "recharge") {
                var total = 0, percent;
                var instance = gachaItems[commandData] || 0;
                if (instance < 1) {
                    safaribot.sendMessage(src, "Gachpon: This item is not available from Gachapon.", safchan);
                } else {
                    for (var e in gachaItems) {
                        total += gachaItems[e];
                    }
                    percent = instance / total * 100;
                    safaribot.sendMessage(src, "Gachpon: The rate of " + finishName(commandData) + " is " + instance + "/" + total + ", or " + percent.toFixed(2) + "%.", safchan);
                }

                total = 0;
                instance = finderItems[commandData] || 0;
                if (instance < 1) {
                    safaribot.sendMessage(src, "Itemfinder: This item is not available from Itemfinder.", safchan);
                } else {
                    for (var e in finderItems) {
                        total += finderItems[e];
                    }
                    percent = instance / total * 100;
                    safaribot.sendMessage(src, "Itemfinder: The rate of " + finishName(commandData) + " is " + instance + "/" + total + ", or " + percent.toFixed(2) + "%.", safchan);
                }
            } else {
                safaribot.sendMessage(src, "No such item!", safchan);
            }
            return true;
        }
        if (command === "wild" || command == "wilds" || command === "horde" || command === "wildevent") {
            if (currentPokemon) {
                safaribot.sendMessage(src, "There's already a Wild Pokemon out there silly!", safchan);
                return true;
            }
            var info = getInputPokemon(commandData), num = info.num, makeShiny = info.shiny, amount = 1;
            if (command === "wilds") {
                makeShiny = true;
            }
            if (command === "horde") {
                amount = 3; //Android might look crowded if more than 3
            }
            if (command === "wildevent") {
                wildEvent = true;
            }
            safari.createWild(num, makeShiny, amount);
            return true;
        }
        if (command === "contest" || command === "contestsoft") {
            if (command == "contestsoft") {
                contestBroadcast = false;
            }
            if (contestCount > 0) {
                contestCount = 1;
            } else {
                safari.startContest(commandData);
            }
            return true;
        }
        if (command === "precontest") {
            if (contestCount > 0) {
                safaribot.sendMessage(src, "You can't use this command during a contest!", safchan);
            } else {
                contestCooldown = 181;
                safaribot.sendMessage(src, "Entering the pre-contest preparation phase!", safchan);
            }
            return true;
        }
        if (command === "wipesafari") {
            var name = commandData.toLowerCase();
            var playerId = sys.id(name);

            var player = getAvatarOff(name);
            if (player) {
                if (playerId) {
                    SESSION.users(playerId).safari = null;
                }
                rawPlayers.remove(name);
                safaribot.sendAll(commandData + "'s safari has been reset!", safchan);
            } else {
                safaribot.sendMessage(src, "No such person!", safchan);
            }
            return true;
        }
        if (command === "loadsafari") {
            var info;
            try {
                info = JSON.parse(commandData);
            } catch (err) {
                safaribot.sendMessage(src, "Invalid JSON!", safchan);
                return;
            }
            var name = info.id;
            var id = sys.id(name);
            if (id) {
                SESSION.users(id).safari = info;
            }

            safari.saveGame(info);
            safaribot.sendMessage(src, "Created save with the name " + name + "!", safchan);
            return true;
        }
        if (command === "forgerecord") {
            var cmd = commandData.split(":");
            var target = cmd[0];
            var player = getAvatarOff(target);
            if (!player) {
                safaribot.sendMessage(src, "No such player!", safchan);
                return true;
            }
            var record = cmd[1];
            if (!(record in playerTemplate.records)) {
                safaribot.sendMessage(src, "Invalid record!", safchan);
                return true;
            }
            var recValue = parseInt(cmd[2], 10);
            if (isNaN(recValue)) {
                safaribot.sendMessage(src, "Invalid amount!", safchan);
                return true;
            }
            player.records[record] = recValue;
            this.sanitize(player);
            this.saveGame(player);
            safaribot.sendAll(target.toCorrectCase() + "'s \"" + record + "\" record has been changed to " + recValue + " by " + sys.name(src) + "!", safchan);
            return true;
        }
        if (command === "reassignid") {
            var target = commandData;
            var player = getAvatarOff(target);
            if (!player) {
                safaribot.sendMessage(src, "No such player!", safchan);
                return true;
            }
            if (player.balls.entry > 0) {
                safaribot.sendMessage(src, "This player has entries in the current raffle, you're not allowed to change their ID!", safchan);
                return true;
            }
            this.assignIdNumber(player, true);
            this.saveGame(player);
            safaribot.sendMessage(src, target.toCorrectCase() + "'s ID has been reset and is now " + player.idnum + ".", safchan);
            return true;
        }
        if (command === "safaripay") {
            var cmd = commandData.split(":");
            var target = cmd[0];
            var player = getAvatarOff(target);
            if (!player) {
                safaribot.sendMessage(src, "No such player!", safchan);
                return true;
            }
            var moneyGained = parseInt(cmd[1], 10);
            if (isNaN(moneyGained)) {
                safaribot.sendMessage(src, "Invalid amount!", safchan);
                return true;
            }
            player.money += moneyGained;
            this.sanitize(player);
            this.saveGame(player);
            safaribot.sendAll(target.toCorrectCase() + " has been awarded with $" + moneyGained + " by " + sys.name(src) + "!", safchan);
            return true;
        }
        if (command === "safarigift") {
            var cmd = commandData.split(":");
            if (cmd.length < 2) {
                safaribot.sendMessage(src, "Invalid format! Use /safarigift Player:Item:Amount.", safchan);
                return true;
            }
            var target = cmd[0];
            var res, playerArray = [];

            if (target.indexOf(", ") !== -1) {
                res = target.split(", ");
                for (var i = 0; i < res.length; i++) {
                    playerArray.push(res[i]);
                }
            } else if (target.indexOf(",") !== -1) {
                res = target.split(",");
                for (var i = 0; i < res.length; i++) {
                    playerArray.push(res[i]);
                }
            } else {
                playerArray.push(target);
            }

            var item = cmd[1].toLowerCase();
            var itemQty = cmd.length > 2 ? parseInt(cmd[2], 10) : 1;
            if (isNaN(itemQty)) {
                itemQty = 1;
            }

            if (allItems.indexOf(item) === -1) {
                safaribot.sendMessage(src, "No such item!", safchan);
                return true;
            }
            //I'm lazy...
            if (item === "entry") {
                safaribot.sendMessage(src, "You can't gift raffle entries!", safchan);
                return true;
            }

            var player, index, invalidPlayers = [];
            for (var j = 0; j < playerArray.length; j++) {
                player = getAvatarOff(playerArray[j]);
                if (!player) {
                    invalidPlayers.push(playerArray[j]);
                    index = playerArray.indexOf(playerArray[j]);
                    playerArray.splice(index, 1);
                    continue;
                }
                player.balls[item] += itemQty;
                this.updateShop(player.id, item);
                this.sanitize(player);
                this.saveGame(player);
            }
            safaribot.sendAll(readable(playerArray.map(function (x) { return x.toCorrectCase(); }), "and") + " has been awarded with " + itemQty + " " + finishName(item) + " by " + sys.name(src) + "!", safchan);
            if (invalidPlayers.length > 0) {
                safaribot.sendMessage(src, readable(invalidPlayers, "and") + (invalidPlayers.length > 1 ? " were" : " was") + "  not given anything because their name did not match any current save file.", safchan);
            }
            return true;
        }
        if (command === "changeboost") {
            safari.changeDailyBoost(commandData);
            return true;
        }
        if (command === "changescientist") {
            safari.changeScientistQuest(commandData);
            safaribot.sendMessage(src, "You changed the scientist quest to request for " + poke(scientistQuest.pokemon) + ".", safchan);
            return true;
        }
        if (command === "findsaves") {
            safaribot.sendMessage(src, "List of all saves by name: " + Object.keys(rawPlayers.hash).sort().join(", "), safchan);
            return true;
        }
        if (command === "scare" || command === "glare") {
            if (currentPokemon) {
                safaribot.sendMessage(src, "You glared at the Wild Pokémon until they ran away!", safchan);
                if (command === "scare") {
                    safaribot.sendAll(sys.name(src) + " scared " + (currentPokemonCount > 1 ? "all " : "") + "the " + poke(currentPokemon) + " away!", safchan);
                }
                currentPokemon = null;
                currentPokemonCount = 1;
                wildEvent = false;
            }
            return true;
        }
        if (command === "bestow") {
            var cmd = commandData.split(":");
            if (cmd.length < 2) {
                safaribot.sendMessage(src, "Invalid format! Use /bestow Player:Pokémon.", safchan);
                return true;
            }
            var target = cmd[0];
            var playerId = sys.id(target);
            var player = getAvatarOff(target);
            if (!player) {
                safaribot.sendMessage(src, "No such player!", safchan);
                return true;
            }
            var info = getInputPokemon(cmd[1]);
            if (!info.num) {
                safaribot.sendMessage(src, "Invalid Pokémon!", safchan);
                return true;
            }
            safaribot.sendMessage(src, "You gave a " + info.name + " to " + target.toCorrectCase() + "!", safchan);
            if (playerId) {
                safaribot.sendMessage(playerId, "You received a " + info.name + "!", safchan);
            }
            player.pokemon.push(info.id);
            this.saveGame(player);
            return true;
        }
        if (command === "clearjackpot") {
            gachaJackpot = 100;
            safaribot.sendAll("Gachapon Jackpot was reset!", safchan);
            return true;
        }
        if (command === "changelastid") {
            var value = parseInt(commandData, 10);
            if (isNaN(value)) {
                safaribot.sendMessage(src, "Invalid number!", safchan);
                return true;
            }
            permObj.add("lastIdAssigned", value);
            permObj.save();
            safaribot.sendMessage(src, "Last ID number reset to " + value + ".", safchan);
            return true;
        }
        if (command === "wipesafariall") {
            var info = commandData.toLowerCase().split(":");
            if (info[0] !== "confirm") {
                safaribot.sendMessage(src, "This will wipe all Safari's save data. If you wish to proceed, type /wipesafariall confirm.", safchan);
                return true;
            }
            if (info.length < 2 || info[1] !== "really") {
                safaribot.sendMessage(src, "Are you absolutely sure you want to delete all saves? This cannot be undone! To confirm, type /wipesafariall confirm:really.", safchan);
                return true;
            }

            var onChannel = sys.playerIds(safchan);
            for (var e in onChannel) {
                if (sys.isInChannel(onChannel[e], safchan) && getAvatar(onChannel[e])) {
                    SESSION.users(onChannel[e]).safari = null;
                }
            }
            rawPlayers.clear();
            safaribot.sendAll("Safari has been completely reset!", safchan);
            return true;
        }
        if (command === "update") {
            if (contestCount > 0 || contestCooldown < 181) {
                safaribot.sendMessage(src, "You shouldn't update during or right before a contest!", safchan);
            } else if (currentPokemon) {
                safaribot.sendMessage(src, "You shouldn't update while a Wild Pokemon is out!", safchan);
            } else {
                sys.sendHtmlAll("<font color='#3daa68'><timestamp/><b>±PA:</b></font> <b>Ding-dong! The Safari Game is over! Please return to the front counter while an update is applied!</b>", safchan);
                safariUpdating = true;
            }
            return true;
        }
        if (command === "cancelupdate") {
            if (safariUpdating) {
                safariUpdating = false;
                sys.sendHtmlAll("<font color='#3daa68'><timestamp/><b>±Attendant:</b></font> <b>Welcome to the Safari Zone! You can catch all the Pokémon you want in the park! We'll call you on the PA when you run out of time or an update is needed!</b>", safchan);
            } else {
                safaribot.sendMessage(src, "Safari was not in an updating state.", safchan);
            }
            return true;
        }
        return false;
    };
    this.init = function () {
        var name = defaultChannel;
        if (sys.existChannel(name)) {
            safchan = sys.channelId(name);
        }
        else {
            safchan = sys.createChannel(name);
        }
        SESSION.global().channelManager.restoreSettings(safchan);
        SESSION.channels(safchan).perm = true;
        rawPlayers = new MemoryHash(saveFiles);
        tradeBans = new MemoryHash(tradebansFile);
        permObj = new MemoryHash(permFile);
        try {
            npcShop = JSON.parse(permObj.get("npcShop"));
        } catch (err) {
            npcShop = {};
        }
        try {
            dailyBoost = JSON.parse(permObj.get("dailyBoost"));
        } catch (err) {
            this.changeDailyBoost();
        }
        try {
            scientistQuest = JSON.parse(permObj.get("scientistQuest"));
        } catch (err) {
            this.changeScientistQuest();
        }
        lastIdAssigned = loadLastId();
        this.updateLeaderboards();
        sys.sendHtmlAll("<font color='#3daa68'><timestamp/><b>±Attendant:</b></font> <b>Welcome to the Safari Zone! You can catch all the Pokémon you want in the park! We'll call you on the PA when you run out of time or an update is needed!</b>", safchan);
    };
    this.afterChannelJoin = function (src, channel) {
        if (channel == safchan) {
            this.loadGame(src);
        }
        return false;
    };
    this.beforeChannelLeave = function (src, channel) {
        if (channel == safchan && getAvatar(src)) {
            this.clearPlayer(src);
            this.saveGame(getAvatar(src));
        }
        return false;
    };
    this.afterChangeTeam = function (src) {
        if (sys.isInChannel(src, safchan)) {
            var player = getAvatar(src);
            if (player) {
                if (sys.name(src).toLowerCase() !== player.id) {
                    this.clearPlayer(src);
                    this.saveGame(player);

                    SESSION.users(src).safari = null;
                    this.loadGame(src);
                }
            } else {
                this.loadGame(src);
            }
        }
        return false;
    };
    this.stepEvent = function () {
        contestCooldown--;
        releaseCooldown--;
        baitCooldown--;
        successfulBaitCount--;

        if (currentBattles.length > 0 && contestCooldown % 4 === 0) {
            for (var e = currentBattles.length - 1; e >= 0; e--) {
                var battle = currentBattles[e];
                battle.nextTurn();
                if (battle.finished) {
                    currentBattles.splice(e, 1);
                }
            }
        }
        if (currentAuctions.length > 0 && contestCooldown % 8 === 0) {
            for (var e = currentAuctions.length - 1; e >= 0; e--) {
                var auction = currentAuctions[e];
                auction.nextTurn();
                if (auction.finished) {
                    currentAuctions.splice(e, 1);
                }
            }
        }

        if (successfulBaitCount <= 0) {
            lastBaitersDecay--;
        }
        if (preparationPhase > 0) {
            preparationPhase--;
            if (preparationPhase <= 0) {
                var name, i;
                var list = Object.keys(preparationThrows);
                for (i in preparationThrows) {
                    if (preparationThrows[i] == "quick") {
                        list.push(i);
                        list.push(i);
                    }
                }
                var throwers = list.shuffle(), alreadyThrow = [];
                if (preparationFirst) {
                    if (throwers.indexOf(preparationFirst) !== -1) {
                        throwers.splice(throwers.indexOf(preparationFirst), 1);
                        throwers.splice(0, 0, preparationFirst);
                    }
                }
                for (i = 0; i < throwers.length; i++) {
                    name = throwers[i];
                    if (sys.isInChannel(sys.id(name), safchan) && alreadyThrow.indexOf(name) === -1) {
                        alreadyThrow.push(name);
                        safari.throwBall(sys.id(name), preparationThrows[name], false, true);
                    }
                }
                preparationFirst = null;
            }
        }
        if (contestCooldown === 180) {
            nextTheme = ["none"];
            nextTheme = nextTheme.concat(Object.keys(contestThemes).shuffle().slice(0, 3));

            nextRules = {};
            var rulesDesc = [];
            for (var n = 0; n < nextTheme.length; n++) {
                var t = nextTheme[n];
                if (t == "none") {
                    nextRules[t] = safari.pickRules(null);
                } else {
                    nextRules[t] = safari.pickRules(t);
                }
                rulesDesc.push("Rules for " + themeName(t) + " --- " + safari.translateRules(nextRules[t]));
            }

            sys.sendAll("*** ************************************************************ ***", safchan);
            safaribot.sendAll("A new " + (nextTheme !== "none" ? themeName(nextTheme) + "-themed" : "") + " Safari contest will start in 3 minutes! Prepare your active Pokémon and all Poké Balls you need!", safchan);
            for (n = 0; n < rulesDesc.length; n++) {
                safaribot.sendAll(" --- " + rulesDesc[n], safchan);
            }
            sys.sendAll("*** ************************************************************ ***", safchan);

            sys.sendAll("*** ************************************************************ ***", 0);
            safaribot.sendAll("A new " + (nextTheme !== "none" ? themeName(nextTheme) + "-themed" : "") + " Safari contest will start in 3 minutes at #" + defaultChannel + "! Prepare your active Pokémon and all Poké Balls you need!", 0);
            sys.sendAll("*** ************************************************************ ***", 0);
            safari.flashPlayers();
            var players = sys.playersOfChannel(safchan);
            for (var pid in players) {
                var player = getAvatar(players[pid]);
                if (player) {
                    safari.fullBoxWarning(players[pid]);
                }
            }
        }
        if (contestCooldown === 0) {
            safari.startContest("*");
        }
        if (lastBaitersDecay === 0) {
            lastBaiters.shift();
            lastBaitersDecay = lastBaitersDecayTime;
        }
        SESSION.global().safariContestCooldown = contestCooldown;
        SESSION.global().safariBaitCooldown = baitCooldown;
        SESSION.global().safariReleaseCooldown = releaseCooldown;

        if (contestCount > 0) {
            contestCount--;
            if (contestCount === 0) {
                var winners = [], pokeWinners = [], maxCaught = 0, maxBST = 0;
                for (var e in contestCatchers) {
                    if (contestCatchers[e].length >= maxCaught) {
                        if (contestCatchers[e].length > maxCaught) {
                            winners = [];
                            pokeWinners = [];
                            maxCaught = contestCatchers[e].length;
                        }
                        winners.push(e);
                        pokeWinners.push(poke(getAvatarOff(e).party[0]));
                    }
                }
                var tieBreaker = [], bst, name, top = winners.length, catchersBST = {}, allContestants = [];

                safari.compileThrowers();
                var allContestants = Object.keys(contestCatchers), pokemonSpawned = 0;
                for (e in contestCatchers) {
                    catchersBST[e] = add(contestCatchers[e].map(getBST));
                    pokemonSpawned += contestCatchers[e].length;
                }
                if (top > 1) {
                    maxBST = 0;
                    pokeWinners = [];
                    for (e in winners) {
                        name = winners[e];
                        bst = catchersBST[name];

                        if (bst >= maxBST) {
                            if (bst > maxBST) {
                                tieBreaker = [];
                                pokeWinners = [];
                                maxBST = bst;
                            }
                            tieBreaker.push(name);
                            pokeWinners.push(poke(getAvatarOff(name).party[0]));
                        }
                    }
                    winners = tieBreaker;
                }
                allContestants.sort(function(a, b) {
                    if (contestCatchers[a].length > contestCatchers[b].length) {
                        return -1;
                    }
                    else if (contestCatchers[a].length < contestCatchers[b].length) {
                        return 1;
                    }
                    else if (catchersBST[a] > catchersBST[b]) {
                        return -1;
                    }
                    else if (catchersBST[a] < catchersBST[b]) {
                        return 1;
                    }
                    return 0;
                });

                var playerScore = function(name) {
                    return "(Caught " + contestCatchers[name].length + ", BST " + catchersBST[name] + ")";
                };

                sys.sendAll("*** ************************************************************ ***", safchan);
                safaribot.sendAll("The Safari contest is now over! Please come back during the next contest!", safchan);
                if (Object.keys(contestCatchers).length === 1) {
                    safaribot.sendAll("No prizes have been given because there was only one contestant!", safchan);
                    winners = [];
                } else if (winners.length > 0) {
                    safaribot.sendAll(readable(winners.map(function (x) { return x.toCorrectCase(); }), "and") + ", with the help of their " + readable(pokeWinners, "and") + ", caught the most Pokémon (" + maxCaught + (top > 1 ? ", total BST: " + maxBST : "") + ") during the contest and has won a prize pack!", safchan);
                }
                if (allContestants.length > 0) {
                    safaribot.sendAll(allContestants.map(function (x) { return x.toCorrectCase() + " " + playerScore(x); }).join(", "), safchan);
                }
                sys.sendAll("*** ************************************************************ ***", safchan);

                var player, winner, playerId, amt;
                for (e in contestantsCount) {
                    player = getAvatarOff(e);
                    if (contestantsCount[e] > 0 && player) {
                        playerId = sys.id(e);
                        amt = Math.max(Math.floor(Math.min(contestantsCount[e] / pokemonSpawned, 1) * 3.25), 1);
                        player.balls.bait += amt;
                        safari.saveGame(player);
                        if (playerId) {
                            if (e in contestCatchers) {
                                safaribot.sendMessage(playerId, "You finished in " + getOrdinal(winners.contains(e) ? 1 : allContestants.indexOf(e) + 1) + " place " + playerScore(e), safchan);
                            }
                            safaribot.sendMessage(playerId, "You received " + amt + " Bait(s) for participating in the contest!", safchan);
                        }
                    }
                }
                var reward = currentRules && currentRules.rewards ? currentRules.rewards : { gacha: 10 };
                if (winners.length > 0) {
                    var r, rewardName, amt;
                    for (e in winners) {
                        winner = winners[e];
                        player = getAvatarOff(winner);
                        if (player) {
                            rewardName = [];
                            for (r in reward) {
                                amt = reward[r];
                                if (amt > 0) {
                                    player.balls[r] += amt;
                                    if (player.balls[r] > itemCap) {
                                        player.balls[r] = itemCap;
                                    }
                                    rewardName.push(amt + " " + itemAlias(r, false, true) + (amt === 1 ? "" : "s"));
                                }
                            }
                            player.records.contestsWon += 1;
                            safari.saveGame(player);
                            playerId = sys.id(winner);
                            if (playerId) {
                                safaribot.sendMessage(playerId, "You received " + readable(rewardName, "and") + " for winning the contest!", safchan);
                            }
                        }
                    }
                }

                currentPokemon = null;
                currentTheme = null;
                wildEvent = false;
                currentRules = null;
                contestCatchers = {};

                //Clear throwers if the contest ends with a Wild Pokemon uncaught
                preparationPhase = 0;
                preparationThrows = {};
                preparationFirst = null;
                baitCooldown = sys.rand(4,7);

                //Check daily rewards after a contest so players won't need to relog to get their reward when date changes
                var onChannel = sys.playersOfChannel(safchan),
                    today = getDay(now());
                for (e in onChannel) {
                    safari.dailyReward(onChannel[e], today);
                    safari.revertMega(onChannel[e]);
                }
                safari.updateLeaderboards();
                rawPlayers.save();
                if (now() > scientistQuest.expires) {
                    safari.changeScientistQuest();
                }
                if (today >= getDay(dailyBoost.expires)) {
                    safari.changeDailyBoost();
                }
            } else {
                if (!currentPokemon && Math.random() < 0.089743) {
                    var amt = Math.random() < 0.05919 ? 3 : 1;
                    safari.createWild(null, null, amt);
                }
            }
        }
    };
}
module.exports = new Safari();