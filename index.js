const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const mysql = require('mysql2/promise');
const moment = require('moment-timezone');

const express = require('express');
const App = express();
const port = 3001;

App.all('/*', async (req, res) => {
    return res.json({
        message: `Desenvolvido por: https://github.com/lucasfraporti`
    });
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const id_dev = '';
const id_bot = '';
const id_role = '';
const id_c_verification = '';
const id_c_msg = '';
const id_c_log = '';

const timezone = 'America/Sao_Paulo';

client.on('ready', async() => {
    console.log(`Eu, ${client.user.tag}, estou pronto!`);
    await client.channels.cache.get(id_c_msg).send({
        content: 'Para __iniciar__ ou __finalizar__ o seu __ponto__, basta __clicar no botão correspondente__.',
        components: [
            new ActionRowBuilder().setComponents(
                new ButtonBuilder().setCustomId('iniciar').setLabel('Iniciar').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('finalizar').setLabel('Finalizar').setStyle(ButtonStyle.Danger)
            )
        ],
    });
});

client.on('messageCreate', async(msg) => {
    if(msg.author.bot) return;
    if(msg.channel.id === id_c_verification){
        function isNumber(n){ return !isNaN(parseFloat(n)) && isFinite(n); };
        async function searchLog(){
            const connection = await mysql.createConnection({
                host: 'localhost',
                user: 'root',
                password: '',
                database: 'pontos'
            });
            try{
                await msg.guild.members.fetch(msg.author.id).then(async(member) => {
                    if(member.roles.cache.has(id_role) && msg.author.id !== id_bot){
                        if(isNumber(msg.content) && msg.author.id !== id_bot){
                            const verify = await connection.query('SELECT * FROM pontos WHERE id_user = ?;', [msg.content]);
                            if(verify[0].length === 0){
                                msg.delete();
                                await msg.channel.send(`<@${msg.author.id}>, __não encontrei__ nenhuma informação do(a) usuário(a) associado ao __ID informado__.`)
                                .then(msg => { setTimeout(() => msg.delete(), 6500); }).catch(console.error());
                            }else if(verify[0].length >= 1){
                                msg.delete();
                                let userData = verify[0].filter(function(data){ return data; });
                                let result = userData.map(function(value){
                                    let date_close = moment(value.day_close).format('DD/MM/YYYY');
                                    let close_time = value.close;
                                    let total_hours = value.total_time;
                                    if(date_close === 'Invalid date'){ date_close = 'O último ponto do(a) usuário(a) ainda não foi finalizado.'; }
                                    if(close_time === null){ close_time = 'O último ponto do(a) usuário(a) ainda não foi finalizado.'; }                                    
                                    if(total_hours === null){ total_hours = 'O último ponto do(a) usuário(a) ainda não foi finalizado.'; }
                                    return{
                                        "Usuário(a)": value.user,
                                        "ID": value.id_user,
                                        "Data_de_abertura": moment(value.day_open).format('DD/MM/YYYY'),
                                        "Hora_de_entrada": value.open,
                                        "Data_de_fechamento": date_close,
                                        "Hora_de_saída": close_time,
                                        "Total_de_horas_online": total_hours
                                    };
                                });
                                const sumOnline = await connection.query('SELECT TIME_FORMAT(SEC_TO_TIME(SUM(TIME_TO_SEC(total_time))), "%H:%i:%s") AS total_sum_time FROM pontos WHERE id_user = ?;', [msg.content]);
                                function haveText(list, text){
                                    for(const key in list){
                                        if(list[key] === text){
                                            return true;
                                        };
                                    };
                                    return false;
                                };
                                let resultData = {
                                    result,
                                    Total_de_registros_pendentes: 'Não há nenhum ponto pendente de finalização.',
                                    Total_de_registros: 'O(A) usuário(a) já finalizou ' + result.length + ' pontos ao total.',
                                    Total_de_horas_online: 'O(A) usuário(a) já permaneceu ' + sumOnline?.[0]?.[0].total_sum_time + ' online ao total.'
                                };
                                if(haveText(resultData.result[result.length-1], 'O último ponto do(a) usuário(a) ainda não foi finalizado.')){
                                    resultData = {
                                        result,
                                        Total_de_registros_pendentes: 'O(A) usuário(a) está com 1 ponto pendente de finalização.',
                                        Total_de_registros_finalizados: 'O(A) usuário(a) já finalizou ' + (result.length-1) + ' pontos ao total.',
                                        Total_de_horas_online: 'O(A) usuário(a) já permaneceu ' + sumOnline?.[0]?.[0].total_sum_time + ' online ao total.'
                                    };
                                }else if(haveText(resultData.result[result.length-1], 'O último ponto do(a) usuário(a) ainda não foi finalizado.') && sumOnline?.[0]?.[0].total_sum_time === null){
                                    resultData = {
                                        result,
                                        Total_de_registros_pendentes: 'O(A) usuário(a) está com 1 ponto pendente de finalização.',
                                        Total_de_registros_finalizados: 'O(A) usuário(a) já finalizou ' + (result.length-1) + ' pontos ao total.',
                                        Total_de_horas_online: 'O(A) usuário(a) já permaneceu ' + sumOnline?.[0]?.[0].total_sum_time + ' online ao total.'
                                    };
                                };
                                await fetch('https://hastebin.com/documents', {
                                method: 'POST',
                                body: JSON.stringify(resultData, null, 2)
                                }).then(response => {
                                    return response.json();
                                }).then(async(data) => {
                                    await msg.channel.send(`<@${msg.author.id}>, __verifique__, no *hastebin*, __as informações__ dos pontos do(a) <@${msg.content}>.\nhttps://hastebin.com/raw/${data.key}`)
                                    .then(msg => { setTimeout(() => msg.delete(), 20000); }).catch(console.error());
                                });
                            };
                        }else if(isNumber(msg.content) !== true && msg.author.id !== id_bot && msg.author.id !== id_dev){
                            msg.delete();
                            await msg.channel.send(`<@${msg.author.id}>, é permitido enviar __apenas__ o __ID específico__ do(a) usuário(a) neste canal.`)
                            .then(msg => { setTimeout(() => msg.delete(), 6500); }).catch(console.error());
                        };
                    }else if(member.roles.cache.has(id_role) !== true && msg.author.id !== id_bot){
                        msg.delete();
                        await msg.channel.send(`<@${msg.author.id}>, __não__ é permitido __digitar neste canal__.`)
                        .then(msg => { setTimeout(() => msg.delete(), 6500); }).catch(console.error());
                    };
                });
            }catch(error){
                console.error();
            }finally{
                connection.end();
            };
        };
        searchLog().catch(console.error());
    }else if(msg.channel.id === id_c_msg && msg.author.id !== id_bot && msg.author.id !== id_dev){
        msg.delete();
        await msg.channel.send(`<@${msg.author.id}>, __não__ é permitido __digitar neste canal__.`)
        .then(msg => { setTimeout(() => msg.delete(), 6500); }).catch(console.error());
    };
});

client.on('interactionCreate', (interaction) => {
    const authorId = interaction.member.user.id;
    const authorTag = interaction.member.user.username+'#'+interaction.member.user.discriminator;
    if(interaction.isButton()){
        if(interaction.customId === 'iniciar'){
            async function saveEnter(){
                const connection = await mysql.createConnection({
                    host: 'localhost',
                    user: 'root',
                    password: '',
                    database: 'pontos'
                });
                const currentDate = moment().tz(timezone).format("DD/MM/YYYY");
                const currentTime = moment().tz(timezone).format("HH:mm:ss");
                const currentDateSQL = moment().tz(timezone).format("YYYY-MM-DD");
                try{
                    const filter = await connection.query('SELECT * FROM pontos WHERE id_user = ? ORDER BY id DESC LIMIT 1;', [authorId]);
                    if(filter[0].length === 0 || filter[0].length === 1 && filter?.[0]?.[0].close !== null){
                        const count = await connection.query('SELECT COUNT(*) AS counter FROM pontos WHERE close IS NULL;');
                        await interaction.reply(`<@${authorId}>, o seu ponto foi __iniciado__!\n__Data de entrada__: **${currentDate}**\n__Horário__: **${currentTime}**\n\n__Oficiais em serviço__: **${count?.[0]?.[0].counter}**`)
                        .then(setTimeout(() => interaction.deleteReply(), 10000)).catch(console.error());
                        await connection.query('INSERT INTO pontos (user, id_user, day_open, open) VALUES (?, ?, ?, ?);', [authorTag, authorId, currentDateSQL, currentTime]);
                        const mLog = await client.channels.cache.get(id_c_log).send(`Ponto do(a) <@${authorId}>\nUsuário(a): ${authorTag}\n__ID__: **${authorId}**\n__Data de entrada__: **${currentDate}**\n__Hora de entrada__: **${currentTime}**`);
                        await connection.query('UPDATE pontos SET log_msg_id = ? WHERE id_user = ? ORDER BY id DESC LIMIT 1;', [mLog.id, authorId]);
                    }else if(filter?.[0]?.[0].close === null){
                        await interaction.reply(`<@${authorId}>, o seu último ponto __ainda não foi finalizado__. Por favor, __finalize-o__.`)
                        .then(setTimeout(() => interaction.deleteReply(), 10000)).catch(console.error());
                    }else{
                        console.error();
                        await interaction.reply(`<@${authorId}>, houve algum __problema técnico__ comigo.\nPor favor, __entre em contato com o meu suporte__.\n*O seu ponto não foi registrado*.`)
                        .then(setTimeout(() => interaction.deleteReply(), 25000)).catch(console.error());
                    };
                }catch(error){
                    console.error();
                    await interaction.reply(`<@${authorId}>, houve algum __problema técnico__ comigo.\nPor favor, __entre em contato com o meu suporte__.\n*O seu ponto não foi registrado*.`)
                    .then(setTimeout(() => interaction.deleteReply(), 25000)).catch(console.error());
                }finally{
                    connection.end();
                };
            };
            saveEnter().catch(console.error());
        }else if(interaction.customId === 'finalizar'){
            async function saveExit(){
                const connection = await mysql.createConnection({
                    host: 'localhost',
                    user: 'root',
                    password: '',
                    database: 'pontos'
                });
                const currentDate = moment().tz(timezone).format("DD/MM/YYYY");
                const currentTime = moment().tz(timezone).format("HH:mm:ss");
                const currentDateSQL = moment().tz(timezone).format("YYYY-MM-DD");
                try{
                    const find = await connection.query('SELECT * FROM pontos WHERE id_user = ? ORDER BY id DESC LIMIT 1;', [authorId]);
                    if(find?.[0]?.[0] === undefined){
                        await interaction.reply(`<@${authorId}>, não encontrei __nenhum registro de ponto aberto__ até o momento. Por favor, __inicie um novo__.`)
                        .then(setTimeout(() => interaction.deleteReply(), 10000)).catch(console.error());
                    }else if(find?.[0]?.[0] !== undefined){
                        function getTimeDifference(startTime, finishTime){
                            const dateStart = new Date(`2023-01-01T`+`${startTime}`);
                            const dateFinish = new Date(`2023-01-01T`+`${finishTime}`);
                            const diff = new Date(dateFinish - dateStart);
                            let getH = diff.getUTCHours();
                            let getM = diff.getUTCMinutes();
                            let getS = diff.getUTCSeconds();
                            if(getH < 10){
                                getH = '0'+getH;
                            }if(getM < 10){
                                getM = '0'+getM;
                            }if(getS < 10){
                                getS = '0'+getS;
                            };
                            return `${getH}:${getM}:${getS}`;
                        };
                        const timeDifference = getTimeDifference(find?.[0]?.[0].open, currentTime);
                        if(timeDifference < '00:10:00' || timeDifference === '00:00:00'){
                            await interaction.reply(`<@${authorId}>, o seu ponto *não atingiu o tempo mínimo de duração* e por isso __não foi contabilizado__.`)
                            .then(setTimeout(() => interaction.deleteReply(), 10000)).catch(console.error());
                            await client.channels.cache.get(id_c_log).messages.fetch(find?.[0]?.[0].log_msg_id).then(msg => { msg.delete(); }).catch(console.error());
                            await connection.query('DELETE FROM pontos WHERE id_user = ? ORDER BY id DESC LIMIT 1;', [authorId]);
                        }else if(timeDifference >= '00:10:00'){
                            const filter = await connection.query('SELECT * FROM pontos WHERE id_user = ? ORDER BY id DESC LIMIT 1;', [authorId]);
                            if(filter[0].length === 0 || filter[0].length === 1 && filter?.[0]?.[0].close !== null){
                                await interaction.reply(`<@${authorId}>, o seu último ponto __já foi finalizado__. Por favor, __inicie um novo__.`)
                                .then(setTimeout(() => interaction.deleteReply(), 10000)).catch(console.error());
                            }else if(filter?.[0]?.[0].close === null){
                                await interaction.reply(`<@${authorId}>, o seu ponto foi __finalizado__!\n__Data de saída__: **${currentDate}**\n__Horário__: **${currentTime}**\n__Total de horas online__: **${timeDifference}**`)
                                .then(setTimeout(() => interaction.deleteReply(), 10000)).catch(console.error());
                                await client.channels.cache.get(id_c_log).messages.fetch(find?.[0]?.[0].log_msg_id)
                                .then(msg => {
                                    msg.edit(msg.content + `\n__Data de saída__: **${currentDate}**\n__Hora de saída__: **${currentTime}**\n__Total de horas online__: **${timeDifference}**`);
                                }).catch(console.error());
                                await connection.query('UPDATE pontos SET day_close = ?, close = ?, total_time = ? WHERE id_user = ? ORDER BY id DESC LIMIT 1;', [currentDateSQL, currentTime, timeDifference, authorId]);
                            }else{
                                console.error();
                                await interaction.reply(`<@${authorId}>, houve algum __problema técnico__ comigo.\nPor favor, __entre em contato com o meu suporte__.\n*O seu ponto não foi registrado*.`)
                                .then(setTimeout(() => interaction.deleteReply(), 25000)).catch(console.error());
                            };
                        };
                    };
                }catch(error){
                    console.error();
                    await interaction.reply(`<@${authorId}>, houve algum __problema técnico__ comigo.\nPor favor, __entre em contato com o meu suporte__.\n*O seu ponto não foi registrado*.`)
                    .then(setTimeout(() => interaction.deleteReply(), 25000)).catch(console.error());
                }finally{
                    connection.end();
                };
            };
            saveExit().catch(console.error());
        };
    };
});

client.login('');

App.listen(process.env.PORT || port, () => {
    console.log(`Estou conectado na porta ${port}!`);
});