import https from 'https';

export const request = (options: https.RequestOptions, data?: any) => {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';

            res.on('data', (chunk) => {
                body += chunk;
            });

            res.on('end', (chunk?) => {
                if (chunk) {
                    body += chunk;
                }

                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body,
                });
            });

            res.on('error', (err) => {
                reject(err);
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        // req.on('response', (res) => {
        //     resolve(res);
        // });

        if (data) {
            req.write(data);
        }

        req.end();
    });
};
