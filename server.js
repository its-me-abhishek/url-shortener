const express = require('express');
const mongoose = require('mongoose');
const ShortUrl = require('./models/shortUrl');
const QRCode = require('qrcode');
const app = express();

app.use(express.static('public'));

mongoose.connect('mongodb://localhost/urlShortener', {
  useNewUrlParser: true, useUnifiedTopology: true
});

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));

app.get('/', async (req, res) => {
  const shortUrls = await ShortUrl.find();
  res.render('index', { shortUrls: shortUrls });
});

app.post('/shortUrls', async (req, res) => {
  const fullUrl = req.body.fullUrl;
  const existingShortUrl = await ShortUrl.findOne({ full: fullUrl });
  if (existingShortUrl) {
    res.send("This URL has already been shortened");
  }
  const newShortUrl = await ShortUrl.create({ full: req.body.fullUrl });
  generateQRCode(newShortUrl.short);

  res.redirect('/');
});

app.get('/:shortUrl', async (req, res) => {
  const shortUrl = await ShortUrl.findOne({ short: req.params.shortUrl });
  if (shortUrl == null) return res.sendStatus(404);

  shortUrl.clicks++;
  shortUrl.save();
  res.redirect(shortUrl.full);
});

app.delete('/deleteUrl/:urlId', async (req, res) => {
  const urlId = req.params.urlId;

  try {
    const deletedUrl = await ShortUrl.findByIdAndDelete(urlId);

    if (deletedUrl) {
      res.status(200).json({ message: 'URL deleted successfully' });
    } else {
      res.status(404).json({ error: 'URL not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

async function generateQRCode(shortUrl) {
  try {
    await QRCode.toFile(`public/qrcodes/${shortUrl}.png`, shortUrl);
    console.log('QR Code generated successfully for:', shortUrl);
  } catch (error) {
    console.error('Error generating QR code:', error);
  }
}

app.listen(process.env.PORT || 5000, () => {
  console.log('Server is running...');
});
