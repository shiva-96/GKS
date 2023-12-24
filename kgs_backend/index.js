var crypto = require("crypto");
const express = require('express');
const bodyParser = require('body-parser');
const cors = require("cors");
const mongoose = require('mongoose');


const app = express();
const port = 8081;


app.use(bodyParser.json());
app.use(cors({}))

var secret_key = "dfsvfsdfvbfb"
var encryptionMethod = "AES-256-CBC"
var key = crypto.createHash('sha512').update(secret_key, 'utf-8').digest('hex').substr(0, 32)
var iv = crypto.createHash('sha512').update(secret_key, 'utf-8').digest('hex').substr(0, 16)

mongoose.connect('mongodb://localhost:27017/urlhasher', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
// Create a schema and model for URL data
const urlSchema = new mongoose.Schema({
    originalUrl: String,
    hash: String,
    clicks: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    expiresAt: Date,
});
const Url = mongoose.model('Url', urlSchema);
var savedId;

async function encryptMethod(urlToEncrypt, encryptionMethod, secret, iv, expiresAfter) {
    try {
        var encryptor = crypto.createCipheriv(encryptionMethod, secret, iv);
        var aes_encrypted = encryptor.update(urlToEncrypt, 'utf-8', 'base64') + encryptor.final('base64');

        const url = new Url({
            originalUrl: urlToEncrypt,
            hash: aes_encrypted,
            expiresAt: expiresAfter ? new Date(Date.now() + expiresAfter) : undefined,
        });
        const savedUrl = await url.save();
        // Access the _id of the saved document
        savedId = savedUrl._id;
        return Buffer.from(aes_encrypted).toString('base64')
    } catch (error) {
        console.error('Encryption error:', error.message);
        return null;
    }
}

async function decryptMethod(encryptedMessage, encryptionMethod, secret, iv, getSavedId, gotDateLinkClick) {
    try {
        const url = await Url.findById(getSavedId);
        if (!url) {
            return null;
        }
        url.clicks += 1;
        // Save the changes on the individual document
        await url.save();
        if (new Date(gotDateLinkClick) > new Date(url.expiresAt)) {
            return "Sorry, the link has expired!";
        } else {
            const buff = Buffer.from(encryptedMessage, 'base64');
            encryptedMessage = buff.toString('utf-8');
            const decryptor = crypto.createDecipheriv(encryptionMethod, secret, iv);
            return decryptor.update(encryptedMessage, 'base64', 'utf8') + decryptor.final('utf-8');
        }
    } catch (error) {
        console.error('Decryption error:', error.message);
        return null;
    }
}


app.post('/encrypt', async (req, res) => {
    const url = req.body.originalUrl;
    const expiresAfter = req.body.expiresAfter;
    if (!url) {
        return res.status(400).send('URL parameter is required');
    }
    const encryptedUrl = await encryptMethod(url, encryptionMethod, key, iv, expiresAfter);
    res.json({ hashedUrl: encryptedUrl, urlId: savedId });
})

app.post('/decrypt', async (req, res) => {
    const encryptedData = req.body.encryptedData;
    const getSavedId = req.body.savedId;
    const gotDateLinkClick = req.body.currdate;
    if (!encryptedData) {
        return res.status(400).send('Encrypted data is required');
    }
    const decryptedUrl = await decryptMethod(encryptedData, encryptionMethod, key, iv, getSavedId, gotDateLinkClick);
    res.json({ decryptedUrl });
});

app.listen(port, () => {
    console.log("Server running on port no", port);
})