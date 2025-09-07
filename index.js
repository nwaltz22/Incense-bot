const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const fs = require('fs').promises;
const https = require('https');

// Configuration - Edit these values
const config = {
  token: process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE',
  poketwoId: '716390085896962058',
  logChannel: 'incense-logs',
  prefix: '.',
  staffRoles: ['Admin', 'Moderator', 'Ewganizer','Mod','nikki'],
  adminRoles: ['Admin', 'Moderator']
};

class IncenseBot {
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
      ]
    });

    this.data = {};
    this.pokemonCache = new Set();
    this.loadData();
    this.loadPokemonData();
    this.setupEventHandlers();
  }

  async loadData() {
    try {
      const data = await fs.readFile('data.json', 'utf8');
      this.data = JSON.parse(data);
    } catch (error) {
      console.log('Creating new data file...');
      this.data = { categories: [], loggingEnabled: true, customPokemon: [] };
      await this.saveData();
    }
  }

  async saveData() {
    await fs.writeFile('data.json', JSON.stringify(this.data, null, 2));
  }

  async loadPokemonData() {
    try {
      console.log('Loading Pokemon data from PokéAPI...');
      const data = await this.httpsGet('https://pokeapi.co/api/v2/pokemon?limit=2000');
      const pokemon = JSON.parse(data).results;
      
      for (const poke of pokemon) {
        this.pokemonCache.add(poke.name.toLowerCase());
      }
      
      console.log(`Loaded ${this.pokemonCache.size} Pokemon names`);
    } catch (error) {
      console.error('Failed to load Pokemon data from API, using fallback list:', error.message);
      // Fallback: Add common Pokemon manually if API fails
      this.loadFallbackPokemon();
    }
  }

  loadFallbackPokemon() {
    const commonPokemon = [
      'bulbasaur', 'ivysaur', 'venusaur', 'charmander', 'charmeleon', 'charizard',
      'squirtle', 'wartortle', 'blastoise', 'caterpie', 'metapod', 'butterfree',
      'weedle', 'kakuna', 'beedrill', 'pidgey', 'pidgeotto', 'pidgeot', 'rattata',
      'raticate', 'spearow', 'fearow', 'ekans', 'arbok', 'pikachu', 'raichu',
      'sandshrew', 'sandslash', 'nidoran♀', 'nidorina', 'nidoqueen', 'nidoran♂',
      'nidorino', 'nidoking', 'clefairy', 'clefable', 'vulpix', 'ninetales',
      'jigglypuff', 'wigglytuff', 'zubat', 'golbat', 'oddish', 'gloom', 'vileplume',
      'paras', 'parasect', 'venonat', 'venomoth', 'diglett', 'dugtrio', 'meowth',
      'persian', 'psyduck', 'golduck', 'mankey', 'primeape', 'growlithe', 'arcanine',
      'poliwag', 'poliwhirl', 'poliwrath', 'abra', 'kadabra', 'alakazam', 'machop',
      'machoke', 'machamp', 'bellsprout', 'weepinbell', 'victreebel', 'tentacool',
      'tentacruel', 'geodude', 'graveler', 'golem', 'ponyta', 'rapidash', 'slowpoke',
      'slowbro', 'magnemite', 'magneton', 'farfetchd', 'doduo', 'dodrio', 'seel',
      'dewgong', 'grimer', 'muk', 'shellder', 'cloyster', 'gastly', 'haunter',
      'gengar', 'onix', 'drowzee', 'hypno', 'krabby', 'kingler', 'voltorb',
      'electrode', 'exeggcute', 'exeggutor', 'cubone', 'marowak', 'hitmonlee',
      'hitmonchan', 'lickitung', 'koffing', 'weezing', 'rhyhorn', 'rhydon',
      'chansey', 'tangela', 'kangaskhan', 'horsea', 'seadra', 'goldeen', 'seaking',
      'staryu', 'starmie', 'mrmime', 'scyther', 'jynx', 'electabuzz', 'magmar',
      'pinsir', 'tauros', 'magikarp', 'gyarados', 'lapras', 'ditto', 'eevee',
      'vaporeon', 'jolteon', 'flareon', 'porygon', 'omanyte', 'omastar', 'kabuto',
      'kabutops', 'aerodactyl', 'snorlax', 'articuno', 'zapdos', 'moltres',
      'dratini', 'dragonair', 'dragonite', 'mewtwo', 'mew', 'chikorita', 'bayleef',
      'meganium', 'cyndaquil', 'quilava', 'typhlosion', 'totodile', 'croconaw',
      'feraligatr', 'sentret', 'furret', 'hoothoot', 'noctowl', 'ledyba', 'ledian',
      'spinarak', 'ariados', 'crobat', 'chinchou', 'lanturn', 'pichu', 'cleffa',
      'igglybuff', 'togepi', 'togetic', 'natu', 'xatu', 'mareep', 'flaaffy',
      'ampharos', 'bellossom', 'marill', 'azumarill', 'sudowoodo', 'politoed',
      'hoppip', 'skiploom', 'jumpluff', 'aipom', 'sunkern', 'sunflora', 'yanma',
      'wooper', 'quagsire', 'espeon', 'umbreon', 'murkrow', 'slowking', 'misdreavus',
      'unown', 'wobbuffet', 'girafarig', 'pineco', 'forretress', 'dunsparce',
      'gligar', 'steelix', 'snubbull', 'granbull', 'qwilfish', 'scizor', 'shuckle',
      'heracross', 'sneasel', 'teddiursa', 'ursaring', 'slugma', 'magcargo',
      'swinub', 'piloswine', 'corsola', 'remoraid', 'octillery', 'delibird',
      'mantine', 'skarmory', 'houndour', 'houndoom', 'kingdra', 'phanpy', 'donphan',
      'porygon2', 'stantler', 'smeargle', 'tyrogue', 'hitmontop', 'smoochum',
      'elekid', 'magby', 'miltank', 'blissey', 'raikou', 'entei', 'suicune',
      'larvitar', 'pupitar', 'tyranitar', 'lugia', 'hooh', 'celebi'
    ];
    
    // Add base Pokemon
    for (const pokemon of commonPokemon) {
      this.pokemonCache.add(pokemon.toLowerCase());
    }
    
    // Add custom Pokemon from data file
    if (this.data.customPokemon) {
      for (const pokemon of this.data.customPokemon) {
        this.pokemonCache.add(pokemon.toLowerCase());
      }
    }
    
    console.log(`Loaded ${this.pokemonCache.size} Pokemon names (fallback list + ${this.data.customPokemon?.length || 0} custom)`);
  }

  httpsGet(url) {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });
  }

  setupEventHandlers() {
    this.client.on('ready', () => {
      console.log(`Bot logged in as ${this.client.user.tag}`);
    });

    this.client.on('messageCreate', async (message) => {
      await this.handleMessage(message);
    });
  }

  async handleMessage(message) {
    // Handle incense detection
    if (message.author.id === config.poketwoId) {
      await this.handlePoketwoMessage(message);
      return;
    }

    // Handle commands
    if (message.content.startsWith(config.prefix)) {
      await this.handleCommand(message);
    }
  }

  async handlePoketwoMessage(message) {
    if (message.content === 'You purchased an Incense for 50 shards!') {
      await this.pauseIncense(message.channel);
      await this.log(`🔴 Auto incense pause triggered by ${message.channel}`);
    }
  }

  async handleCommand(message) {
    if (!this.hasStaffRole(message.member)) return;

    const args = message.content.slice(config.prefix.length).trim().split(/\s+/);
    const command = args.shift().toLowerCase();

    try {
      switch (command) {
        case 'pause':
          await this.cmdPause(message);
          break;
        case 'resume':
          await this.cmdResume(message);
          break;
        case 'cat':
          await this.cmdCategory(message, args);
          break;
        case 'extract':
          await this.cmdExtract(message);
          break;
        case 'extractanno':
          await this.cmdExtractAnno(message);
          break;
        case 'logtoggle':
          await this.cmdLogToggle(message);
          break;
        case 'pokelist':
          await this.cmdPokeList(message, args);
          break;
      }
    } catch (error) {
      console.error(`Error handling command ${command}:`, error);
      await message.reply(`❌ Error executing command: ${error.message}`);
    }
  }

  hasStaffRole(member) {
    if (!member) return false;
    return config.staffRoles.some(role => 
      member.roles.cache.some(r => r.name === role)
    );
  }

  hasAdminRole(member) {
    if (!member) return false;
    return config.adminRoles.some(role => 
      member.roles.cache.some(r => r.name === role)
    );
  }

  async pauseIncense(triggerChannel) {
    const guild = triggerChannel.guild;
    const poketwo = guild.members.cache.get(config.poketwoId);
    
    if (!poketwo) {
      console.error('Pokétwo not found in guild');
      return;
    }

    // Check role hierarchy
    const botMember = guild.members.cache.get(this.client.user.id);
    if (poketwo.roles.highest.position >= botMember.roles.highest.position) {
      const warning = `⚠️ Cannot manage Pokétwo permissions - role hierarchy issue in ${guild.name}`;
      console.warn(warning);
      await this.log(warning);
      return;
    }

    let channelCount = 0;
    for (const categoryId of this.data.categories) {
      const category = guild.channels.cache.get(categoryId);
      if (!category) continue;

      const channels = category.children.cache.filter(ch => ch.isTextBased());
      for (const [, channel] of channels) {
        try {
          await channel.permissionOverwrites.edit(poketwo, {
            [PermissionsBitField.Flags.ViewChannel]: false,
            [PermissionsBitField.Flags.SendMessages]: false,
            [PermissionsBitField.Flags.ReadMessageHistory]: false
          });
          channelCount++;
        } catch (error) {
          console.error(`Failed to edit permissions for ${channel.name}:`, error);
        }
      }
    }

    await triggerChannel.send('Incense is now paused.');
    console.log(`Paused Pokétwo in ${channelCount} channels`);
  }

  async resumeIncense(guild) {
    const poketwo = guild.members.cache.get(config.poketwoId);
    
    if (!poketwo) {
      console.error('Pokétwo not found in guild');
      return 0;
    }

    // Check role hierarchy
    const botMember = guild.members.cache.get(this.client.user.id);
    if (poketwo.roles.highest.position >= botMember.roles.highest.position) {
      const warning = `⚠️ Cannot manage Pokétwo permissions - role hierarchy issue in ${guild.name}`;
      console.warn(warning);
      await this.log(warning);
      return 0;
    }

    let channelCount = 0;
    for (const categoryId of this.data.categories) {
      const category = guild.channels.cache.get(categoryId);
      if (!category) continue;

      const channels = category.children.cache.filter(ch => ch.isTextBased());
      for (const [, channel] of channels) {
        try {
          await channel.permissionOverwrites.edit(poketwo, {
            [PermissionsBitField.Flags.ViewChannel]: true,
            [PermissionsBitField.Flags.SendMessages]: true,
            [PermissionsBitField.Flags.ReadMessageHistory]: true
          });
          channelCount++;
        } catch (error) {
          console.error(`Failed to edit permissions for ${channel.name}:`, error);
        }
      }
    }

    return channelCount;
  }

  async cmdPause(message) {
    await this.pauseIncense(message.channel);
    await this.log(`🔴 Manual pause by ${message.author.tag}`);
    await message.reply('✅ Incense paused manually.');
  }

  async cmdResume(message) {
    const channelCount = await this.resumeIncense(message.guild);
    await this.log(`🟢 Manual resume by ${message.author.tag} (${channelCount} channels)`);
    await message.reply(`✅ Incense resumed in ${channelCount} channels.`);
  }

  async cmdCategory(message, args) {
    const subcommand = args[0]?.toLowerCase();

    switch (subcommand) {
      case 'add':
        if (!args[1]) {
          await message.reply('❌ Please provide a category ID: `.cat add <categoryID>`');
          return;
        }
        const addCategoryId = args[1];
        const addCategory = message.guild.channels.cache.get(addCategoryId);
        
        if (!addCategory || addCategory.type !== 4) { // 4 = GUILD_CATEGORY
          await message.reply('❌ Invalid category ID or not a category.');
          return;
        }

        if (this.data.categories.includes(addCategoryId)) {
          await message.reply('❌ Category already registered.');
          return;
        }

        this.data.categories.push(addCategoryId);
        await this.saveData();
        await this.log(`📁 Category added: ${addCategory.name} by ${message.author.tag}`);
        await message.reply(`✅ Added category: **${addCategory.name}**`);
        break;

      case 'remove':
        if (!args[1]) {
          await message.reply('❌ Please provide a category ID: `.cat remove <categoryID>`');
          return;
        }
        const removeCategoryId = args[1];
        const removeIndex = this.data.categories.indexOf(removeCategoryId);
        
        if (removeIndex === -1) {
          await message.reply('❌ Category not found in registered list.');
          return;
        }

        const removeCategory = message.guild.channels.cache.get(removeCategoryId);
        const categoryName = removeCategory ? removeCategory.name : removeCategoryId;
        
        this.data.categories.splice(removeIndex, 1);
        await this.saveData();
        await this.log(`📁 Category removed: ${categoryName} by ${message.author.tag}`);
        await message.reply(`✅ Removed category: **${categoryName}**`);
        break;

      case 'list':
        if (this.data.categories.length === 0) {
          await message.reply('📁 No categories registered.');
          return;
        }

        const categoryList = this.data.categories.map(id => {
          const category = message.guild.channels.cache.get(id);
          return category ? `• ${category.name} (${id})` : `• Unknown Category (${id})`;
        }).join('\n');

        await message.reply(`📁 **Registered Categories:**\n${categoryList}`);
        break;

      default:
        await message.reply('❌ Usage: `.cat add/remove/list [categoryID]`');
    }
  }

  extractPokemonFromText(text) {
    try {
      const lines = text.split('\n');
      const pokemon = new Set();
      
      for (const line of lines) {
        // Remove common template markers and formatting
        const cleanLine = line
          .toLowerCase()
          .replace(/[*_`~]/g, '') // Remove markdown
          .replace(/[^\w\s]/g, ' ') // Replace special chars with spaces
          .trim();
        
        if (!cleanLine) continue;
        
        // Split by spaces and check each word/phrase
        const words = cleanLine.split(/\s+/).filter(w => w.length > 0);
        
        // Check individual words
        for (const word of words) {
          if (word.length > 2 && this.pokemonCache.has(word)) {
            pokemon.add(word);
          }
        }
        
        // Check two-word combinations
        for (let i = 0; i < words.length - 1; i++) {
          const twoWord = `${words[i]}${words[i + 1]}`;
          const twoWordSpace = `${words[i]} ${words[i + 1]}`;
          
          if (this.pokemonCache.has(twoWord)) {
            pokemon.add(twoWord);
          }
          
          // Check for spaced pokemon names like "mr mime"
          const spacedName = twoWordSpace.replace(/\s+/g, '');
          if (this.pokemonCache.has(spacedName)) {
            pokemon.add(spacedName);
          }
        }
        
        // Check three-word combinations
        for (let i = 0; i < words.length - 2; i++) {
          const threeWord = `${words[i]}${words[i + 1]}${words[i + 2]}`;
          if (this.pokemonCache.has(threeWord)) {
            pokemon.add(threeWord);
          }
        }
      }
      
      return Array.from(pokemon).sort();
    } catch (error) {
      console.error('Error in extractPokemonFromText:', error);
      return [];
    }
  }

  async cmdExtract(message) {
    try {
      // Get recent messages to extract from
      const messages = await message.channel.messages.fetch({ limit: 50 });
      let allText = '';
      
      for (const [, msg] of messages) {
        if (msg.author.bot) continue;
        allText += msg.content + '\n';
      }

      const pokemonFound = this.extractPokemonFromText(allText);
      
      if (pokemonFound.length === 0) {
        await message.reply('❌ No valid Pokémon found in recent messages.');
        return;
      }

      // Split into chunks if command is too long (Discord 2000 char limit)
      const command = `N!cl remove ${pokemonFound.join(', ')}`;
      
      if (command.length > 1900) {
        // Split pokemon into chunks
        const chunks = [];
        let currentChunk = [];
        let currentLength = 'N!cl remove '.length;
        
        for (const pokemon of pokemonFound) {
          const pokemonLength = pokemon.length + 2; // +2 for ', '
          if (currentLength + pokemonLength > 1900) {
            chunks.push(`N!cl remove ${currentChunk.join(', ')}`);
            currentChunk = [pokemon];
            currentLength = 'N!cl remove '.length + pokemon.length;
          } else {
            currentChunk.push(pokemon);
            currentLength += pokemonLength;
          }
        }
        
        if (currentChunk.length > 0) {
          chunks.push(`N!cl remove ${currentChunk.join(', ')}`);
        }
        
        for (const chunk of chunks) {
          await message.reply(`\`\`\`${chunk}\`\`\``);
        }
      } else {
        await message.reply(`\`\`\`${command}\`\`\``);
      }
      
      await this.log(`🔍 Extract run by ${message.author.tag}: ${pokemonFound.length} Pokémon found`);
    } catch (error) {
      console.error('Error in cmdExtract:', error);
      await message.reply('❌ An error occurred while extracting Pokémon. Please try again.');
    }
  }

  async cmdExtractAnno(message) {
    try {
      // Parse arguments to get custom emotes
      const args = message.content.slice(config.prefix.length).trim().split(/\s+/);
      args.shift(); // Remove 'extractanno' command
      
      // Get recent messages to extract from
      const messages = await message.channel.messages.fetch({ limit: 50 });
      let allText = '';
      
      for (const [, msg] of messages) {
        if (msg.author.bot) continue;
        allText += msg.content + '\n';
      }

      const pokemonFound = this.extractPokemonFromText(allText);
      
      if (pokemonFound.length === 0) {
        await message.reply('❌ No valid Pokémon found in recent messages.');
        return;
      }

      // Determine which emotes to use
      let emotes;
      if (args.length > 0) {
        // User provided custom emotes - take up to 8
        emotes = args.slice(0, 8);
      } else {
        // Use default heart chain
        emotes = [
          '<:heart8:1329283688919470101>',
          '<:heart7:1329283719781027873>',
          '<:heart6:1329283751217201203>',
          '<:heart5:1329283799120478218>',
          '<:heart4:1329283824806395997>',
          '<:heart3:1329283847195590726>',
          '<:heart2:1329283882708631602>',
          '<:heart1:1329283905395752990>'
        ];
      }
      
      const formattedPokemon = pokemonFound.map((pokemon, index) => {
        const emote = emotes[index % emotes.length];
        return `${emote} ${pokemon}`;
      }).join('\n');

      // Split if message is too long
      if (formattedPokemon.length > 1900) {
        const lines = formattedPokemon.split('\n');
        let currentMessage = '';
        
        for (const line of lines) {
          if (currentMessage.length + line.length + 1 > 1900) {
            await message.reply(currentMessage);
            currentMessage = line;
          } else {
            currentMessage += (currentMessage ? '\n' : '') + line;
          }
        }
        
        if (currentMessage) {
          await message.reply(currentMessage);
        }
      } else {
        await message.reply(formattedPokemon);
      }
      
      // Note: extractanno does not log as per requirements
    } catch (error) {
      console.error('Error in cmdExtractAnno:', error);
      await message.reply('❌ An error occurred while extracting Pokémon. Please try again.');
    }
  }

  async cmdLogToggle(message) {
    if (!this.hasAdminRole(message.member)) {
      await message.reply('❌ This command requires Admin or Moderator role.');
      return;
    }

    this.data.loggingEnabled = !this.data.loggingEnabled;
    await this.saveData();
    
    const status = this.data.loggingEnabled ? 'ON' : 'OFF';
    
    // Always log the toggle action itself
    await this.logForced(`⚙️ Logging toggled ${status} by ${message.author.tag}`);
    await message.reply(`✅ Logging is now **${status}**`);
  }

  async log(message) {
    if (!this.data.loggingEnabled) return;
    await this.logForced(message);
  }

  async logForced(message) {
    try {
      for (const [, guild] of this.client.guilds.cache) {
        const logChannel = guild.channels.cache.find(ch => 
          ch.name === config.logChannel && ch.isTextBased()
        );
        
        if (logChannel) {
          const timestamp = new Date().toLocaleString();
          await logChannel.send(`\`[${timestamp}]\` ${message}`);
          break; // Only log to the first found log channel
        }
      }
    } catch (error) {
      console.error('Failed to send log message:', error);
    }
  }

  async start() {
    await this.client.login(config.token);
  }
}

// Start the bot
const bot = new IncenseBot();
bot.start().catch(error => {
  console.error('Failed to start bot:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down bot...');
  bot.client.destroy();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit, try to continue running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit, try to continue running
});
