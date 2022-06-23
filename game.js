const map = generateLevel();
 
const player = (function() {
  const retVal = RAW.entities.make("player");
  const coords = getAcceptableCoordinate();
  retVal.x = coords[0];
  retVal.y = coords[1];
  return retVal;
}

const enemies = (function() {
  const retArr = [];
  
  const enemyTypes = getListOf("enemies");
  
  for (let i = 0; i < enemyTypes.length; i++) {
    if (RAW.enemies[i].canSpawn()) {
      const numberEnemies = Math.floor(RAW.settings.base_spawn_rate 
      * RAW.enemies[i].spawnRate);
      for (let j = 0; j < numberEnemies; j++) {
        const enemy = RAW.entities.make(enemyTypes[i]);
        const coords = getAcceptableCoordinate();
        enemy.x = coords[0];
        enemy.y = coords[1];
        retArr.push(enemy);
      }
    }
  }
  return retArr; 
})();
  
const entityMatrix = (function() {
  const retMatrix = initializeMatrix(map.length,map[0].length,null);

  const numberShards = RAW.settings.base_spawn_rate 
  * RAW.entities.shards.spawnRate;
  
  for (let i = 0; i < numberShards; i++) {
    const coords = getAcceptableCoordinate();
    const shard = RAW.entities.make("shard");
    shard.x = coords[0];
    shard.y = coords[1];

    retMatrix[coords[0]][coords[1]] = shard;
  }
  
  const numberPotions = RAW.settings.base_spawn_rate * RAW.
  for (let i = 0; i < potion; i++) {
    const coords = getAcceptableCoordinate();
    retMatrix[coords[0]][coords[1]] = ITEMS.potion;
  }

  for (let i = 0; i < enemies.length; i++) {
    retMatrix[enemies[i].x][enemies[i].y] = enemies[i];
  }    
 
  retMatrix[player.x][player.y] = player;

  //Get rid of any monsters right next to player
  for (let row = (player.x - 1); row < (player.x + 2); row++) {
    for (let col = (player.y - 1); col < (player.y + 2); col++) {
      if (entityMatrix[row][col].id === "minion" 
      || entityMatrix[row][col].id === "maxion") {    
        relocateMonsterAtIdx(getEnemyAt(row, col));
      }
    }
  }

  return retMatrix;
})();
    
function getAcceptableCoordinate() {
  let acceptable = false;
  let coordsArr = [-1, -1];

  while (!acceptable) {
    coordsArr[0] = getRandomCoordinate(map.length);
    coordsArr[1] = getRandomCoordinate(map[0].length);

    if (map[coordsArr[0]][coordsArr[1]] === MAP.text.floor) {
      acceptable = true;
    }
  }
  return coordsArr;
}
  
const cookies = document.cookie;
  
const highscore = getHighScores();
  
let isNewHighScore = false;
    
let keyPressed = -1;
let play = true;

function attack(aggressor, defender) {
  if (agressor.canFight() && defender.canFight()) {

    let atkBonus = 0;
  
    if (aggressor.id === "minion" || aggressor.id === "maxion") {
      atkBonus = Math.ceil(level/4);
    } else {
      atkBonus = Math.ceil(aggressor.atk/5);
    }
    
    let defenderHit = (random(20) + atkBonus) > defender.def;
  
    if (defenderHit) {
      let dmgToDefender = Math.floor(aggressor.atk/2) 
      + random(Math.ceil(aggressor.atk/2));
      
      defender.hp -= dmgToDefender;

      if (defender.hp < 1) {
        let type = defender.id;
  
        entityMatrix[defender.x][defender.y] = SPACE;
        defender.x = -1;
        defender.y = -1;
  
        if (random(2) < 1 && aggressor.isLucky()) {
          aggressor.lucky();
        }
  
        for (let i = 0; i < defender.shards; i++) {
          aggressor.shards++;     
        }
  
        return false;
      }
    } else {
      if (aggressor === player) {
        VIEW.drawStatus("You missed!");
      } else if (aggressor.id === "minion") {
        VIEW.drawStatus("The minion missed!");
      } else if (aggressor.id === "maxion") {
        VIEW.drawStatus("The Maxion missed!");
      }
    }
  
    return true;
  }
}
  
function enemyMoves(idx) {
  let randomMovementChoice = random(2);
	
  if ((player.x < enemies[idx].x) && (player.y < enemies[idx].y)) {
    if (randomMovementChoice === 0) {
      moveEnemyTo(idx, (enemies[idx].x - 1),(enemies[idx].y));
    } else {
      moveEnemyTo(idx, (enemies[idx].x),(enemies[idx].y - 1));
    }
  } else if ((player.x < enemies[idx].x) && (player.y === enemies[idx].y)) {
    moveEnemyTo(idx, (enemies[idx].x - 1), enemies[idx].y);
  } else if ((player.x < enemies[idx].x) && (player.y > enemies[idx].y)) {
    if (randomMovementChoice === 0) {
      moveEnemyTo(idx, (enemies[idx].x - 1),(enemies[idx].y));
    } else {
      moveEnemyTo(idx, (enemies[idx].x),(enemies[idx].y + 1));
    }
  } else if ((player.x === enemies[idx].x) && (player.y < enemies[idx].y)) {
    moveEnemyTo(idx, enemies[idx].x, (enemies[idx].y - 1));
  } else if ((player.x === enemies[idx].x) && (player.y > enemies[idx].y)) {
    moveEnemyTo(idx, enemies[idx].x, (enemies[idx].y + 1));
  } else if ((player.x > enemies[idx].x) && (player.y < enemies[idx].y)) {
    if (randomMovementChoice === 0) {
      moveEnemyTo(idx, (enemies[idx].x + 1),(enemies[idx].y));
    } else {
      moveEnemyTo(idx, (enemies[idx].x),(enemies[idx].y - 1));
    }
  } else if ((player.x > enemies[idx].x) && (player.y === enemies[idx].y)) {
    moveEnemyTo(idx, (enemies[idx].x + 1), enemies[idx].y);
  } else if ((player.x > enemies[idx].x) && (player.y > enemies[idx].y)) {
    if (randomMovementChoice === 0) {
      moveEnemyTo(idx, (enemies[idx].x + 1),(enemies[idx].y));
    } else {
      moveEnemyTo(idx, (enemies[idx].x),(enemies[idx].y + 1));
    }
  }
}
  
async function start() {
  //TODO: add this back in after new VIEW is complete
  //checkForMobileDevice();
     
  setInterval(
    VIEW.refreshScreen(
      map, 
      entityMatrix, 
      player.x, 
      player.y
    ), 
    (1000 / RAW.settings.fps));
  
  while (play) {
    await waitingKeypress();
  
    if (keyPressed > 0) {
      loop();
    }	
  }
  
  maybeUpdateHighScores();
    
  if (isNewHighScore) {
    VIEW.drawStatus("New high score!");
  }
  
  clearInterval();
}
  
function loop() {
  if (player.shards !== 0 &&
    player.shards % 7 == 0) {
    randomRegen();
  }

  //Get coordinates of proposed player move
  let proposedPlayerX = player.x;
  let proposedPlayerY = player.y;
  
  if (RAW.settings.keymap[keyPressed] === LEFT) {
    proposedPlayerY--;
  } else if (RAW.settings.keymap[keyPressed] === RIGHT) {
    proposedPlayerY++;
  } else if (RAW.settings.keymap[keyPressed] === UP) {
    proposedPlayerX--;
  } else if (RAW.settings.keymap[keyPressed] === DOWN) {
    proposedPlayerX++;
  } else if (RAW.settings.keymap[keyPressed] === DOWNRIGHT) {
    proposedPlayerX++;
    proposedPlayerY++;
  } else if (RAW.settings.keymap[keyPressed] === DOWNLEFT) {
    proposedPlayerX++;
    proposedPlayerY--;
  } else if (RAW.settings.keymap[keyPressed] === UPRIGHT) {
    proposedPlayerX--;
    proposedPlayerY++;
  } else if (RAW.settings.keymap[keyPressed] === UPLEFT) {
    proposedPlayerX--;
    proposedPlayerY--;
  }

  //These conditions need to prevent the player from moving 
  //(and also updating the player x and y coordinates incorrectly)
  let monsterPresent = false;
  let moveDownStairs = false;

  //Complete player's move based on what's in the proposed move square
  if (checkForMonsters(proposedPlayerX,proposedPlayerY)) {
    monsterPresent = attack(
      player, 
      enemies[getEnemyAt(proposedPlayerX,proposedPlayerY)]
    );
  }

  if (!monsterPresent 
  && checkForShards(proposedPlayerX,proposedPlayerY)) {
    entityMatrix[proposedPlayerX][proposedPlayerY] = null;
    RAW.shard.onConsume(player);
  }

  if (!monsterPresent 
  && checkForPotions(proposedPlayerX,proposedPlayerY)){
    pickupPotion();
    entityMatrix[proposedPlayerX][proposedPlayerY] = null;
  }

  if (!monsterPresent && 
  checkForBuffs(proposedPlayerX, proposedPlayerY)) {
    pickupBuff();
    entityMatrix[proposedPlayerX][proposedPlayerY] = null;
  }

  if (!monsterPresent && !moveDownStairs 
  && map[proposedPlayerX][proposedPlayerY] !== RAW.map.text.wall) {
    movePlayerTo(proposedPlayerX,proposedPlayerY);
  }

  //Check for enemies next to player
  //Those enemies attack, others move toward player
  for (let i = 0; i < enemies.length; i++) {
    if ((enemies[i].x > 0 && enemies[i].y > 0) 
    && (Math.abs(player.x - enemies[i].x) < 2) 
    && Math.abs(player.y - enemies[i].y < 2)) {
      attack(enemies[i],player);
    } else {
      if (enemies[i].id === "maxion" || random(20) > 1) {
        enemyMoves(i);
      }	
    }	
  }
	
  //Check to see if player has died during the loop
  if (player.hp < 1) {
    player.hp = 0;
    play = false;
    VIEW.drawStatus("You died.");
  }
}
  
  function pickupBuff() {
  }
  
  function pickupPotion() {
  }
  
  function pickupShard(entity) {
      entity.picksUpShard();
      //	entity.picksUpShard();  
  }
   
  function randomRegen() {
    if (player.hp < player.base_hp) {
      player.hp++;
      VIEW.drawStatus("You feel a benevolent presence! 1 HP gained.");
    }
  }

  //The following variables and functions are from utils.js... move them back?

function avoidWalls(axis, value) {
	let mapDimension = ROWS - 1;

	if (axis === COLS) {
		mapDimension = COLS - 1;
	}
	
	if (value == 0) { 
		return ++value;
	} else if (value == mapDimension) { 
		return --value;
	} else {
		return value;
	}
}

function checkForMobileDevice() {
	window.addEventListener("load", () => {
		let mobile = navigator.userAgent.toLowerCase().match(/mobile/i);
		if (mobile !== null) {
			isMobile = true;
		}
	});
}

function checkForMonsters(x,y) {
	if (entityMatrix[x][y].id === "minion"  || 
		entityMatrix[x][y].id === "maxion") {
		return true;
	}

	return false;
}

function checkForPotions(x,y) {
	if (entityMatrix[x][y] === ITEMS.potion) {
		return true;
	}

	return false;
}

//TODO: redo buffs
function checkForBuffs(x,y) {
//    if (Matrix[BUFF][x][y] === BUFF) {
//        return true;
//    }

    return false;
}

function checkForShards(x,y) {
	if (entityMatrix[x][y] === SHARD.renderable.symbol) {
		return true;
	}

	return false;
}

function getEnemyAt(x,y) {
	for (let i = 0; i < enemies.length; i++) {
		if (enemies[i].x === x && enemies[i].y === y) {
			return i;
		}
    }

	return -1;
}

function getHighScores() {
    const key = "highscores=";
    let score = "";

    if (cookies.length > 0 && cookies.search(key) !== -1) {

        let highscoresString = cookies.substring(cookies.search(key) + key.length);

        let idx = 0;

        while (idx < cookies.length && highscoresString[idx] !== ";") {
            score += highscoresString[idx];
            idx++;
        }

        highscores = parseInt(score);
    } else {
        highscores = 0;
    }
}

function getRandomCoordinate(axis) {
	let mapLimit = ROWS;

	if  (axis === COLS) {
		mapLimit = COLS;
	}

    return avoidWalls(axis, random(mapLimit-1));
}

function initializeAllMatrices() {
    for (let grid in Matrix) {
        Matrix[grid] = initializeMatrix(ROWS, COLS, SPACE);
    }
}

function loadAll() {
    const game = {};
    
    return game;
}
function maybeUpdateHighScores() {

    if (highscores < player.shards) {
        highscores = player.shards;
        isNewHighScore = true;
    }
    
    document.cookie = "highscores=" + highscores + "; hoarderType=" + typeMonsterKilledPlayer + "; hoardedLevel=" + level + "; shardsLost=" + shardsLost + "; SameSite=Strict;";
    console.log("cookies updated: " + document.cookie);
}

function monstersCleared() {
    for (let i = 0; i < enemies.length; i++) {
        if (enemies[i].HP > 0) {
            return false;
        }
    }

    return true;
}

function movePlayerTo(x,y) {
	entityMatrix[player.x][player.y] = SPACE;
	entityMatrix[x][y] = player;
	player.x = x;
	player.y = y;
}

function moveEnemyTo(idx,x,y) {
	if (enemies[idx].x > 0 && enemies[idx].y > 0 && map[x][y] === MAP.text.floor && entityMatrix[x][y] === SPACE) {
		entityMatrix[enemies[idx].x][enemies[idx].y] = SPACE;
		if (checkForShards(x,y)) {
			enemies[idx].shards++;
		}

        entityMatrix[x][y] = enemies[idx];
		
        enemies[idx].x = x;
		enemies[idx].y = y;
	}
} 

function noEntitiesOnSquare(checkX, checkY) {
  if (entityMatrix[checkX] !== undefined && entityMatrix[checkX][checkY] !== SPACE) {
    return false;
    }
  return true;
  }

function random(value) {
	return Math.floor(Math.random() * value);
}

function relocateMonsterAtIdx(i) {
    let acceptablePlacement = false;

    while (!acceptablePlacement) {
        let x = getRandomCoordinate(ROWS);
        let y = getRandomCoordinate(COLS);

        if (map[x][y] === MAP.text.floor && noEntitiesOnSquare(x, y)) {
	    entityMatrix[enemies[i].x][enemies[i].y] = SPACE;

            enemies[i].x = x;
            enemies[i].y = y;

            acceptablePlacement = true;
        }
    }
}

function waitingKeypress() {
  return new Promise((resolve) => {
    document.addEventListener('keydown', onKeyHandler);
	document.addEventListener('touchstart', handleTouchStart);        
   	document.addEventListener('touchmove', handleTouchMove);
    function onKeyHandler(e) {
	for (key in RAW.settings.keymap) {
		if (e.keyCode === parseInt(key)) {
        		document.removeEventListener('keydown', onKeyHandler);
			keyPressed = e.keyCode;
			resolve();
		}
      }
    }
    	var xDown = null;                                                        	var yDown = null;

	function getTouches(evt) {
  		return evt.touches ||             // browser API
         	evt.originalEvent.touches; // jQuery
	}                                                     
                                                                         
	function handleTouchStart(evt) {
    		const firstTouch = getTouches(evt)[0];                                      
    		xDown = firstTouch.clientX;                                     
    		yDown = firstTouch.clientY;                                      
	};                                                
                                                                         
	function handleTouchMove(evt) {
		//detect quadrant
		//determine slop of line
		//designate x, y or x+y shift as necessary

		if ( ! xDown || ! yDown ) {
        		return;
    		}
    	
		var xUp = evt.touches[0].clientX;                                   		
		var yUp = evt.touches[0].clientY;

    		var xDiff = xDown - xUp;
    		var yDiff = yDown - yUp;
                
		let slope = yDiff/xDiff;
            
		if (xDiff > 0 && yDiff > 0) {
			//Quadrant IV
			if (slope < .7) {
				keyPressed = 100;
			} else if (slope === .7) {
				keyPressed = 103;
			} else if (slope > .7 && slope < 1.8) {
				keyPressed = 103;	
			} else if (slope === 1.8) {
				keyPressed = 103;
			} else if (slope > 1.8) {
				keyPressed = 104;
			}
		} else if (xDiff > 0 && yDiff < 0) {
			//Quadrant III
			if (slope > -.7) {
				keyPressed = 100;
			} else if (slope === -.7) {
				keyPressed = 97;
			} else if (slope < -.7 && slope > -1.8) {
				keyPressed = 97;	
			} else if (slope === -1.8) {
				keyPressed = 97;
			} else if (slope < -1.8) {
				keyPressed = 98;
			}
		} else if (xDiff < 0 && yDiff > 0) {
			//Quadrant I
			if (slope > -.7) {
				keyPressed = 102;
			} else if (slope === -.7) {
				keyPressed = 105;
			} else if (slope < -.7 && slope > -1.8) {
				keyPressed = 105;	
			} else if (slope === -1.8) {
				keyPressed = 105;
			} else if (slope < -1.8) {
				keyPressed = 104;
			}
		} else if (xDiff < 0 && yDiff < 0) {
			//Quadrant II
			if (slope < .7) {
				keyPressed = 102;
			} else if (slope === .7) {
				keyPressed = 99;
			} else if (slope > .7 && slope < 1.8) {
				keyPressed = 99;	
			} else if (slope === 1.8) {
				keyPressed = 99;
			} else if (slope > 1.8) {
				keyPressed = 98;
			}
		} else {               
    		//This should only fire if one of the x or y values is 0
		if ( Math.abs( xDiff ) > Math.abs( yDiff ) ) {/*most significant*/
        		if ( xDiff > 0 ) {
            			keyPressed = 100; 
        		} else {
            			keyPressed = 102;
        		}                       
    		} else {
        		if ( yDiff > 0 ) {
            			keyPressed = 104;
        		} else { 
            			keyPressed = 98;
        		}                                                                 
    		}
		}
    
		/* reset values */
    		xDown = null;
    		yDown = null;                   
		document.removeEventListener('touchstart', handleTouchStart);        
   		document.removeEventListener('touchmove', handleTouchMove);
		resolve();                          

	};
  });
}

