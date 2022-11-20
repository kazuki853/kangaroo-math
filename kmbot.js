const { Client, GatewayIntentBits, AttachmentBuilder, escapeMarkdown } = require('discord.js');
const dotenv = require('dotenv');

dotenv.config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages]
});

const katex = require('katex');

const nodeHtmlToImage = require("node-html-to-image");
const LAUNCH_OPTION = { args: ['--no-sandbox', '--disable-setuid-sandbox'] };

async function makeMathImage(tex_code) {
    const katex_equation_html = katex.renderToString(tex_code, {
        strict: "ignore",
        displayMode: true,
    });
    const math_html =
`<!DOCTYPE html>
<html>
<head>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.15.1/dist/katex.min.css" integrity="sha384-R4558gYOUz8mP9YWpZJjofhk+zx0AS11p36HnD2ZKj/6JR5z27gSSULCNHIRReVs" crossorigin="anonymous">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.15.1/dist/katex.min.js" integrity="sha384-z1fJDqw8ZApjGO3/unPWUPsIymfsJmyrDVWC8Tv/a1HeOtGmkwNd/7xUS0Xcnvsx" crossorigin="anonymous"></script>
<style>
body {
    width: 10000px;
    height: 10000px;
}
.katex {
    font-size: 50px;
    display: block;
    width: fit-content;
    height: fit-content;
    padding: 30px;
}
// .katex .text{
//     font-family: KaTeX_Main, 'Source Han Serif', serif;
// }
</style>
</head>
<body>
${katex_equation_html}
</body>
</html>`
    const base64_img = await nodeHtmlToImage({
        selector: ".katex",
        html: math_html,
        puppeteerArgs: LAUNCH_OPTION
    });
    var bufferImage = new Buffer.from(base64_img, "base64");
    return bufferImage;
}

client.once("ready", async () => {
    const commands = [{
        name: "tex",
        description: "Make KaTeX image!",
        options: [{
            type: 3, // 3 = STRING
            name: "tex_code",
            description: "TeX code",
            required: true
        }],
    }];
    await client.application.commands.set(commands);
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) {
        return;
    }
    if (interaction.commandName === 'tex') {
        await interaction.deferReply();
        const str = interaction.options.getString("tex_code");
        console.log("Rendering KaTeX image: " + str);
        let img;
        try {
            img = await makeMathImage(str); 
        } catch (error) {
            await interaction.editReply(escapeMarkdown(error.message));
            return;
        }
        const attachment = new AttachmentBuilder(img, { name: 'katex_image.png' });
        await interaction.editReply({ files: [attachment] });
    }
});

client.login(process.env.DISCORD_TOKEN);