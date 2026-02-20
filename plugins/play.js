const axios = require("axios");

module.exports = {
  command: "play",
  aliases: ["song", "music"],
  category: "music",
  description: "Search and download YouTube audio (MP3)",
  usage: ".play <song name>",

  async handler(sock, message, args, context = {}) {
    const chatId = context.chatId || message.key.remoteJid;
    const query = args.join(" ").trim();

    if (!query) {
      return await sock.sendMessage(chatId, {
        text: "❌ *Give song name*\nUsage: .play <song name>"
      }, { quoted: message });
    }

    try {
      await sock.sendMessage(chatId, {
        text: "🔍 *Searching...*"
      }, { quoted: message });

      // 🔎 Step 1: Search
      const searchUrl = `https://api.qasimdev.dpdns.org/api/youtube/play?apiKey=qasim-dev&query=${encodeURIComponent(query)}`;

      const searchRes = await axios.get(searchUrl, { timeout: 60000 });

      if (!searchRes.data?.success) {
        return sock.sendMessage(chatId, {
          text: "❌ No result found"
        }, { quoted: message });
      }

      const result = searchRes.data.data;

      const ytLink = result.url || result.webpage_url;
      const title = result.title;
      const author = result.author;
      const duration = result.duration;

      await sock.sendMessage(chatId, {
        text: `✅ *Found*\n\n🎵 ${title}\n👤 ${author}\n⏱ ${duration}\n\n⬇ Downloading...`
      }, { quoted: message });

      // 🎵 Step 2: Download MP3
      const downloadUrl = `https://api.qasimdev.dpdns.org/api/youtube/download?apiKey=qasim-dev&url=${encodeURIComponent(ytLink)}&format=mp3`;

      const dlRes = await axios.get(downloadUrl, { timeout: 60000 });

      if (!dlRes.data?.success) {
        return sock.sendMessage(chatId, {
          text: "❌ Download failed"
        }, { quoted: message });
      }

      const audioUrl = dlRes.data.data.download;
      const thumbnail = dlRes.data.data.thumbnail;

      let thumbBuffer = null;
      try {
        const img = await axios.get(thumbnail, { responseType: "arraybuffer" });
        thumbBuffer = Buffer.from(img.data);
      } catch {}

      await sock.sendMessage(chatId, {
        audio: { url: audioUrl },
        mimetype: "audio/mpeg",
        fileName: `${title}.mp3`,
        contextInfo: {
          externalAdReply: {
            title: title,
            body: `${author} • ${duration}`,
            thumbnail: thumbBuffer,
            mediaType: 2,
            sourceUrl: ytLink
          }
        }
      }, { quoted: message });

    } catch (error) {
      console.error("Play MP3 Error:", error);

      let msg = "❌ Failed!\n\n";

      if (error.response?.status === 401) {
        msg += "API key invalid.";
      } else if (error.response?.status === 429) {
        msg += "Rate limit exceeded. Wait 10 seconds.";
      } else {
        msg += error.message;
      }

      sock.sendMessage(chatId, { text: msg }, { quoted: message });
    }
  }
};
