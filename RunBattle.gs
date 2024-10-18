class ShipType {
  constructor(id) {
    this.id = id;                // Unique ID for the ship
    this.heavyAttack = 0;        // Amount of Heavy Attack (default: 0)
    this.lightAttack = 0;        // Amount of Light Attack (default: 0)
    this.pointAttack = 0;        // Amount of Point Attack (default: 0)
    this.missileAttack = 0;      // Amount of Missile Attack (default: 0)
    this.currentHP = 0;          // Current HP of the ship (default: 0)
    this.startingHP = 0;         // Starting HP of the ship (default: 0)
    this.armour = false;         // Armour value (default: 0)
    this.hasFCS = false;         // Whether the ship has FCS (default: false)
    this.baseRepairCost = 0;     // Base Repair Cost (Production Cost)
    this.isDestroyed = false;    // Whether the ship is destroyed (default: false)
    this.hullType = '';          // Hull type of the ship (default: empty)
    this.shipClass = '';         // Ship Class
    this.hangers = 0;            // Hangers
  }

  // Set values for the ship attributes from ShipDesigns and HullTypes
  setAttributes(heavyAttack, lightAttack, pointAttack, missileAttack, startingHP, armour, hasFCS, hullType, productionCost, shipClass, hangers) {
    this.heavyAttack = heavyAttack;
    this.lightAttack = lightAttack;
    this.pointAttack = pointAttack;
    this.missileAttack = missileAttack;
    this.startingHP = startingHP;
    this.currentHP = startingHP; // Initially, currentHP = startingHP
    this.armour = armour;
    this.hasFCS = hasFCS;
    this.hullType = hullType;  // Set hull type
    this.baseRepairCost = productionCost;  // Directly set Production Cost as base repair cost
    this.isDestroyed = this.currentHP <= 0;
    this.shipClass = shipClass;
    this.hangers = hangers;
  }

  // Method to reset the ship's current HP
  resetHP() {
    this.currentHP = this.startingHP;
  }

  // Method to apply damage to the ship
  applyDamage(damage) {
    this.currentHP -= damage;
    if (this.currentHP < 0) {
      this.currentHP = 0;  // Ensure currentHP doesn't go below 0
      this.heavyAttack = 0;
      this.lightAttack = 0;
      this.pointAttack = 0;
      this.missileAttack = 0;
    }
    this.isDestroyed = this.currentHP <= 0;  // Check if ship is destroyed
  }

  // Method to get the current repair cost based on damage
  getRepairCost() {
    // Check if startingHP is greater than 0 to avoid division by zero
    if (this.startingHP === 0) {
      Logger.log("Error: Starting HP is 0, cannot calculate repair cost.");
      return 0;  // Return 0 repair cost if startingHP is 0
    }

    // Check if the starting and current HP are the same (no damage taken)
    if (this.startingHP === this.currentHP) {
      return 0;  // No damage taken, no repair cost
    }

    var damageTaken = this.startingHP - this.currentHP;  // Amount of damage taken
    var damagePercentage = damageTaken / this.startingHP;  // Calculate percentage of damage
    var currentRepairCost = this.baseRepairCost * damagePercentage;  // Multiply by the base repair cost

    return currentRepairCost;  // Return the current repair cost
  }

  // Get whether the ship is destroyed
  getDestroyedStatus() {
    return this.isDestroyed ? 'Yes' : 'No';
  }
}

function setupBattle() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // Access relevant sheets
  var WeaponTypesSheet = spreadsheet.getSheetByName('WeaponTypes');
  var ShipDesignsSheet = spreadsheet.getSheetByName('ShipDesigns');
  var BattleSetupSheet = spreadsheet.getSheetByName('BattleSetup');
  var HullTypesSheet = spreadsheet.getSheetByName('HullTypes');
  var BattleOutputSheet = spreadsheet.getSheetByName('BattleOutput');
  var BattleTotalsSheet = spreadsheet.getSheetByName('BattleTotals');

  // Get data from HullTypes, ShipDesigns, WeaponTypes, BattleSetup
  var hullTypesData = HullTypesSheet.getDataRange().getValues();
  var weaponTypesData = WeaponTypesSheet.getDataRange().getValues();
  var shipDesignsData = ShipDesignsSheet.getDataRange().getValues();
  var battleSetupData = BattleSetupSheet.getDataRange().getValues();

  // Clear the BattleOutputSheet before appending new data
  BattleOutputSheet.clear();
  BattleTotalsSheet.clear();

  var advantageMultiplier = battleSetupData[1][5];

  // Weapon types will be stored dynamically
  var weaponTypes = {};

  // Loop through the WeaponTypes data and build the weapon type object
  for (var i = 1; i < weaponTypesData.length; i++) {
    var weaponType = weaponTypesData[i][0];  // e.g., 'Heavy Battery'
    var fighterHit = weaponTypesData[i][1];   // e.g., 10% (Fighter Hit)
    var screenHit = weaponTypesData[i][2];   // e.g., 10% (Screen Hit)
    var capitalHit = weaponTypesData[i][3];  // e.g., 40% (Capital Hit)
    var armourPen = weaponTypesData[i][4];   // e.g., 35% Armour Penetration

    weaponTypes[weaponType] = {
      'Fighter':fighterHit,
      'Screen': screenHit,
      'Capital': capitalHit,
      'ArmourPen': armourPen
    };
  };
  
  // Arrays to hold ship instances for each team
  var teamOneShips = [];
  var teamTwoShips = [];

  // Loop through the BattleSetup data to get the ship counts for both teams
  for (var i = 1; i < battleSetupData.length; i++) {
    var shipClass = battleSetupData[i][0];  // Ship Class (e.g., "Example Frigate")
    var teamOneShipCount = battleSetupData[i][1];  // Number of Ships for Team 1 (column B)
    var teamTwoShipCount = battleSetupData[i][3];  // Number of Ships for Team 2 (column D)

    // Look up ship design for this class in ShipDesigns
    for (var j = 0; j < shipDesignsData.length; j++) {
      if (shipDesignsData[j][0] === shipClass) {
        // Found the matching ship class in ShipDesigns
        var heavyAttack = shipDesignsData[j][2];  // Heavy Battery
        var lightAttack = shipDesignsData[j][3];  // Light Battery
        var pointAttack = shipDesignsData[j][4];  // Point Defence
        var missileAttack = shipDesignsData[j][8];  // Missile
        var armour = shipDesignsData[j][10] === 1;  // Armour
        var hasFCS = shipDesignsData[j][6] === 1; 
        var hangers = shipDesignsData[j][11]; 

        // Initialize default values
        var startingHP = 0;
        var hullType = '';
        var hullSize = shipDesignsData[j][1];
        for (var k = 0; k < hullTypesData.length; k++) {
          if (hullTypesData[k][0] === hullSize) {  // Match by HullSize (Small, Medium, etc.)
            startingHP = hullTypesData[k][3];  // Get the HP from HullTypes
            hullType = hullTypesData[k][2];    // Get the HullType (Screen, Capital)
            break;
          }
        }

        // Log the values for debugging
        if (!hullType || startingHP === 0) {
          Logger.log("Error: HullType or HP not found for ship class: " + shipClass);
        }

        // Create the specified number of ships for Team 1
        for (var k = 0; k < teamOneShipCount; k++) {
          var shipId = (teamOneShips.length + 1);  // Unique ID for each ship in Team 1
          var newShip = new ShipType(shipId);
          newShip.setAttributes(heavyAttack, lightAttack, pointAttack, missileAttack, startingHP, armour, hasFCS, hullType, shipDesignsData[j][15], shipClass, hangers);
          teamOneShips.push(newShip);
        }

        // Create the specified number of ships for Team 2
        for (var k = 0; k < teamTwoShipCount; k++) {
          var shipId = (teamTwoShips.length + 1);  // Unique ID for each ship in Team 2
          var newShip = new ShipType(shipId);
          newShip.setAttributes(heavyAttack, lightAttack, pointAttack, missileAttack, startingHP, armour, hasFCS, hullType, shipDesignsData[j][15], shipClass, hangers);
          teamTwoShips.push(newShip);  // Add to team 2
        }
      }
    }
  }

  teamOneShips.forEach(ship => {
    for (var k = 0; k < ship.hangers * 4; k++)
    {
      var shipId = (teamOneShips.length + 1);  // Unique ID for each ship in Team 1
      var newShip = new ShipType(shipId);
      newShip.setAttributes(0, 0, 1, 1, 4, false, false, "Fighter", 0, "Multirole Fighter Squadron", 0);
      teamOneShips.push(newShip);
    }
  });

  teamTwoShips.forEach(ship => {
    for (var k = 0; k < ship.hangers * 4; k++)
    {
      var shipId = (teamTwoShips.length + 1);  // Unique ID for each ship in Team 2
      var newShip = new ShipType(shipId);
      newShip.setAttributes(0, 0, 1, 1, 4, false, false, "Fighter", 0, "Multirole Fighter Squadron", 0);
      teamTwoShips.push(newShip);
    }
  });

  // Set headers for BattleOutputSheet
  BattleOutputSheet.appendRow([
    'Team', 'Class', 'ID', 'HullType', 'Current HP', 'Starting HP', 'Repair Cost', 'Destroyed'
  ]);

  var currentTurn = 0;
  var maxTurn = 3;
  simulateBattle();

  var team1TotalDestroyed = 0;
  var team1TotalRepair = 0;
  var team2TotalDestroyed = 0;
  var team2TotalRepair = 0;
  teamOneShips.forEach(ship => {
    if (ship.isDestroyed == true && ship.hullType != "Fighter")
    {
      team1TotalDestroyed++;
    }
    team1TotalRepair += ship.getRepairCost();
  });
  teamTwoShips.forEach(ship => {
    if (ship.isDestroyed == true && ship.hullType != "Fighter")
    {
      team2TotalDestroyed++;
    }
    team2TotalRepair += ship.getRepairCost();
  });

  BattleTotalsSheet.appendRow(['Battle Over', currentTurn +' Turns']);
  BattleTotalsSheet.appendRow(['Team 1 Total Ships Destroyed:', team1TotalDestroyed]);
  BattleTotalsSheet.appendRow(['Team 1 Total Repair Costs:', team1TotalRepair]);
  BattleTotalsSheet.appendRow(['Team 2 Total Ships Destroyed:', team2TotalDestroyed]);
  BattleTotalsSheet.appendRow(['Team 2 Total Repair Costs:', team2TotalRepair]);

  // Populate the BattleOutputSheet for Team 1
  teamOneShips.forEach(ship => {
    if (ship.hullType != "Fighter")
      BattleOutputSheet.appendRow(['Team 1', ship.shipClass, ship.id, ship.hullType, ship.currentHP, ship.startingHP, ship.getRepairCost(), ship.getDestroyedStatus()]);
  });

  // Populate the BattleOutputSheet for Team 2
  teamTwoShips.forEach(ship => {
    if (ship.hullType != "Fighter")
      BattleOutputSheet.appendRow(['Team 2', ship.shipClass, ship.id, ship.hullType, ship.currentHP, ship.startingHP, ship.getRepairCost(), ship.getDestroyedStatus()]);
  });

  function simulateBattle() {
    // Log the start of the simulation
    currentTurn += 1;
    Logger.log("Turn: " + currentTurn)

    // Function to select a random ship from the enemy team
    function getRandomEnemyShip(team) {
      var enemyTeam = (team === 'team1') ? teamTwoShips : teamOneShips;
      var randomIndex = Math.floor(Math.random() * enemyTeam.length);
      return enemyTeam[randomIndex];
    }

    // Function to roll for critical hit
    function rollCriticalHit() {
      return Math.random() <= 0.1;  // 10% chance of critical hit
    }

    // Iterate through each ship in Team 1 and log its attack types
    Logger.log("Team 1 Attacks:");
    teamOneShips.forEach(ship => {
      // Log each type of attack for the ship
      if (ship.heavyAttack > 0) {
        for (let i = 0; i < ship.heavyAttack; i++) {
          // Pick random enemy ship from Team 2
          var enemyShip = getRandomEnemyShip('team1');
          var hitChance = weaponTypes['Heavy Battery'][enemyShip.hullType];

          if (ship.FCS) {
            hitChance *= 1.1; // 10% boost if the ship has FCS
          }

          if (advantageMultiplier == 1)
          {
            hitChance *= 1.1;
          }

          var roll = Math.random();
          // Roll to hit (check based on the ship's hullType)
          if (roll <= hitChance) {

            // Check for critical hit
            if (rollCriticalHit()) {
              var criticalDamage = 4;  // Critical hit does 4x damage
              enemyShip.applyDamage(criticalDamage);
            } else {
              enemyShip.applyDamage(1); // Apply normal damage
            }
          }
        }
      }

      if (ship.lightAttack > 0) {
        for (let i = 0; i < ship.lightAttack; i++) {
          // Pick random enemy ship from Team 2
          var enemyShip = getRandomEnemyShip('team1');
          var hitChance = weaponTypes['Light Battery'][enemyShip.hullType];

          if (ship.FCS) {
            hitChance *= 1.1; // 10% boost if the ship has FCS
          }

          if (advantageMultiplier == 1)
          {
            hitChance *= 1.1;
          }

          var roll = Math.random();
          // Roll to hit (check based on the ship's hullType)
          if (roll <= hitChance) {

            // Check for critical hit
            if (rollCriticalHit()) {
              var criticalDamage = 4;  // Critical hit does 4x damage
              enemyShip.applyDamage(criticalDamage);
            } else {
              enemyShip.applyDamage(1); // Apply normal damage
            }
          }
        }
      }

      if (ship.pointAttack > 0) {
        for (let i = 0; i < ship.pointAttack; i++) {
          // Pick random enemy ship from Team 2
          var enemyShip = getRandomEnemyShip('team1');
          var hitChance = weaponTypes['Point Defence'][enemyShip.hullType];

          if (ship.FCS) {
            hitChance *= 1.1; // 10% boost if the ship has FCS
          }

          if (advantageMultiplier == 1)
          {
            hitChance *= 1.1;
          }

          var roll = Math.random();
          // Roll to hit (check based on the ship's hullType)
          if (roll <= hitChance) {

            // Check for critical hit
            if (rollCriticalHit()) {
              var criticalDamage = 4;  // Critical hit does 4x damage
              enemyShip.applyDamage(criticalDamage);
            } else {
              enemyShip.applyDamage(1); // Apply normal damage
            }
          }
        }
      }

      if (ship.missileAttack > 0) {
        for (let i = 0; i < ship.missileAttack; i++) {
          // Pick random enemy ship from Team 2
          var enemyShip = getRandomEnemyShip('team1');
          var hitChance = weaponTypes['Missile'][enemyShip.hullType];

          if (ship.FCS) {
            hitChance *= 1.1; // 10% boost if the ship has FCS
          }

          if (advantageMultiplier == 1)
          {
            hitChance *= 1.1;
          }

          var roll = Math.random();
          // Roll to hit (check based on the ship's hullType)
          if (roll <= hitChance) {

            // Check for critical hit
            if (rollCriticalHit()) {
              var criticalDamage = 4;  // Critical hit does 4x damage
              enemyShip.applyDamage(criticalDamage);
            } else {
              enemyShip.applyDamage(1); // Apply normal damage
            }
          }
        }
      }
    });

    // Iterate through each ship in Team 2 and log its attack types
    Logger.log("Team 2 Attacks:");
    teamTwoShips.forEach(ship => {
      // Log each type of attack for the ship
      if (ship.heavyAttack > 0) {
        for (let i = 0; i < ship.heavyAttack; i++) {
          // Pick random enemy ship from Team 1
          var enemyShip = getRandomEnemyShip('team2');
          var hitChance = weaponTypes['Heavy Battery'][enemyShip.hullType];

          if (ship.FCS) {
            hitChance *= 1.1; // 10% boost if the ship has FCS
          }

          if (advantageMultiplier == 2)
          {
            hitChance *= 1.1;
          }

          var roll = Math.random();
          // Roll to hit (check based on the ship's hullType)
          if (roll <= hitChance) {

            // Check for critical hit
            if (rollCriticalHit()) {
              var criticalDamage = 4;  // Critical hit does 4x damage
              enemyShip.applyDamage(criticalDamage);
            } else {
              enemyShip.applyDamage(1); // Apply normal damage
            }
          }
        }
      }

      if (ship.lightAttack > 0) {
        for (let i = 0; i < ship.lightAttack; i++) {
          // Pick random enemy ship from Team 1
          var enemyShip = getRandomEnemyShip('team2');
          var hitChance = weaponTypes['Light Battery'][enemyShip.hullType];

          if (ship.FCS) {
            hitChance *= 1.1; // 10% boost if the ship has FCS
          }

          if (advantageMultiplier == 2)
          {
            hitChance *= 1.1;
          }

          var roll = Math.random();
          // Roll to hit (check based on the ship's hullType)
          if (roll <= hitChance) {

            // Check for critical hit
            if (rollCriticalHit()) {
              var criticalDamage = 4;  // Critical hit does 4x damage
              enemyShip.applyDamage(criticalDamage);
            } else {
              enemyShip.applyDamage(1); // Apply normal damage
            }
          }
        }
      }
      if (ship.pointAttack > 0) {
        for (let i = 0; i < ship.pointAttack; i++) {
          // Pick random enemy ship from Team 1
          var enemyShip = getRandomEnemyShip('team2');
          var hitChance = weaponTypes['Point Defence'][enemyShip.hullType];

          if (ship.FCS) {
            hitChance *= 1.1; // 10% boost if the ship has FCS
          }

          if (advantageMultiplier == 2)
          {
            hitChance *= 1.1;
          }

          var roll = Math.random();
          // Roll to hit (check based on the ship's hullType)
          if (roll <= hitChance) {

            // Check for critical hit
            if (rollCriticalHit()) {
              var criticalDamage = 4;  // Critical hit does 4x damage
              enemyShip.applyDamage(criticalDamage);
            } else {
              enemyShip.applyDamage(1); // Apply normal damage
            }
          }
        }
      }

      if (ship.missileAttack > 0) {
        for (let i = 0; i < ship.missileAttack; i++) {
          // Pick random enemy ship from Team 1
          var enemyShip = getRandomEnemyShip('team2');
          var hitChance = weaponTypes['Missile'][enemyShip.hullType];

          if (ship.FCS) {
            hitChance *= 1.1; // 10% boost if the ship has FCS
          }

          if (advantageMultiplier == 2)
          {
            hitChance *= 1.1;
          }

          var roll = Math.random();
          // Roll to hit (check based on the ship's hullType)
          if (roll <= hitChance) {

            // Check for critical hit
            if (rollCriticalHit()) {
              var criticalDamage = 4;  // Critical hit does 4x damage
              enemyShip.applyDamage(criticalDamage);
            } else {
              enemyShip.applyDamage(1); // Apply normal damage
            }
          }
        }
      }
    });

    // At the end of every turn there is a 33% chance the battle ends early and each side retreats
    if (currentTurn <= maxTurn)
    {
      // Check if a 33% chance triggers an early end to the battle
      if (Math.random() <= 0.33) {
        return;
      }

      simulateBattle();
    }
  }
}


