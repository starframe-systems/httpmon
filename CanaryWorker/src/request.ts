import https from 'https';

export const request = (options: https.RequestOptions, data?: any) => {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            res.on('end', () => {
                resolve(res);
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (data) {
            req.write(data);
        }

        req.end();
    });
};
