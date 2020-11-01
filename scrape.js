const fs = require('fs');
const uid = require('uid')
const jsonLinkData = require('./linkFetched.json') || [];

const puppeteer = require('puppeteer');
const scrapurl = 'https://my.une.edu.au/courses/';
const scrapCourse = require('./scrapeCourse');


async function start() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(scrapurl, { waitUntil: 'domcontentloaded' });

    const self = {

        parseResult: async () => {
            try {
                let courses = await page.$$('td');

                for (const course of courses) {
                    let courseLink = await course.$eval('a', a => a.href)
                    let courseName = await course.$eval('a', a => a.textContent)

                    if (!jsonLinkData.includes(courseLink)) {
                        console.log(courseName);

                        let courseSaved = await scrapCourse.fetchCourseDetails(courseLink, courseName.trim())
                        if (courseSaved) {
                            jsonLinkData.push(courseLink)
                            fs.writeFile('linkFetched.json', JSON.stringify(jsonLinkData), (err) => {
                                if (err) {
                                    console.log(err);
                                }
                                console.log("Course link is saved. ", courseLink);
                            });
                        }

                    }
                }
            } catch (error) {
                console.log(error);
            }
        },


    }

    let start = await self.parseResult();
    // self.parseResult()
}
start()