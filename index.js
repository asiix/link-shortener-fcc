require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const dns = require("dns");
const mongoose = require("mongoose");

// Basic Configuration
const port = process.env.PORT || 3000;
const uri =
  "mongodb+srv://taowangg13:lollo@cluster0.y4jqge1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Schema = mongoose.Schema;
const urlSchema = new Schema({
  original_url: { type: String, required: true },
  shortened_url: { type: Number, required: true },
});

const Urls = mongoose.model("Urls", urlSchema);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.post("/api/shorturl", function (req, res) {
  const inputUrl = req.body.url;

  try {
    const hostname = new URL(inputUrl).hostname;
    dns.lookup(hostname, async (error) => {
      if (error) {
        res.json({ error: "Invalid URL" });
      } else {
        const existingUrl = await Urls.findOne({ original_url: inputUrl });
        if (existingUrl) {
          res.json({
            original_url: existingUrl.original_url,
            short_url: existingUrl.shortened_url,
          });
        } else {
          const count = await Urls.countDocuments();
          const newUrl = new Urls({
            original_url: inputUrl,
            shortened_url: count + 1,
          });
          await newUrl.save();
          res.json({ original_url: inputUrl, short_url: count + 1 });
        }
      }
    });
  } catch (error) {
    res.json({ error: "Invalid URL" });
  }
});

app.get("/api/shorturl/:shortenedUrl", async function (req, res) {
  const { shortenedUrl } = req.params;
  const urlEntry = await Urls.findOne({
    shortened_url: parseInt(shortenedUrl),
  });
  if (urlEntry) {
    res.redirect(urlEntry.original_url);
  } else {
    res.json({ error: "Shortened URL not found" });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
