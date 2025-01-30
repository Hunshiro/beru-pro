const { EmbedBuilder } = require('discord.js');
const puppeteer = require('puppeteer');

module.exports = {
    name: 'egirl',
    description: 'Sends a random egirl GIF',
    async execute(message) {
        try {
            // Launch Puppeteer
            const browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();
            await page.goto('https://www.redgifs.com/gifs/egirl', { waitUntil: 'load' });

            // Scrape GIF URLs
            const gifs = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('a.GifTile'))
                    .map(el => el.href)
                    .slice(0, 10); // Limit to 10 GIFs
            });

            await browser.close();

            if (gifs.length === 0) return message.reply('No GIFs found.');

            // Pick a random GIF
            const randomGif = gifs[Math.floor(Math.random() * gifs.length)];

            // Create embed
            const embed = new EmbedBuilder()
                .setColor('#FF69B4')
                .setTitle('Here’s an e-girl for you!')
                .setImage(randomGif)
                .setFooter({ text: 'Powered by Redgifs' });

            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            message.reply('Failed to fetch e-girl GIFs.');
        }
    }
};
