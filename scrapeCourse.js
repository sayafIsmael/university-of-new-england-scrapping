const fs = require('fs');
const puppeteer = require('puppeteer');
const jsonCourseData = require('./data.json') || [];

const courseModel = require('./courseModel');

module.exports.fetchCourseDetails = async (scrapurl, courseName) => {
    // (async () => {

    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto(scrapurl, { waitUntil: 'domcontentloaded' });

        const courseInfos = await page.$$('table[id="furtherInformationTable"] > tbody > tr')
        const year = await page.$eval('a[class="active"] > span', span => span.textContent)

        if (courseInfos.length > 2) {
            let cricosCode = "NA";
            let courseLevel = "NA";
            let courseStudyModes = [];
            let totalCreditPoints = "NA";
            let courseLink = scrapurl;
            let isAvailableOnline = false;
            let prerequisites = "NA"
            let semester = []

            for (courseInfo of courseInfos) {

                const detail = await courseInfo.$$eval('td', tdata => tdata.map(td => td.textContent)).catch(e => console.log('Error: ', e.message))
                const courseData = await courseInfo.$$('td').catch(e => console.log('Error: ', e.message))
                const key = detail[0].trim()
                const value = detail[1].trim()

                if (key == 'Course Type') {
                    courseLevel = value;
                }
                if (key == 'CRICOS Code') {
                    cricosCode = value;
                }
                if (key == 'Commencing') {
                    let units = await courseData[1].$$('tr')
                    for (unit of units) {
                        const data = await unit.$$eval('td', tdata => tdata.map(td => td.textContent)).catch(e => console.log('Error: ', e.message))
                        if (data.length) {
                            semester.push({
                                year: "NA",
                                semester: data[1],
                                attendanceMode: data[2],
                                location: data[0],
                                learningMethod: "NA"
                            })
                            if (data[2] == "Online") {
                                isAvailableOnline = true
                            }
                        }
                    }
                }
                if (key == 'Total Credit Points') {
                    totalCreditPoints = value;
                }
                if (key == 'Entry Requirements') {
                    prerequisites = value;
                }
                if (key == 'Course Duration') {
                    let durations = await courseData[1].$$eval('li', list => list.map(li => li.textContent)).catch(e => console.log('Error: ', e.message))
                    durations.map(duration => {
                        if (duration.includes('Full-time')) {
                            courseStudyModes.push({
                                studyMode: "Full-time",
                                duration: duration.replace('Full-time', '').trim()
                            })
                        }
                        if (duration.includes('Part-time')) {
                            courseStudyModes.push({
                                studyMode: "Part-time",
                                duration: duration.replace('Part-time', '').trim()
                            })
                        }
                    })
                    // console.log(duration)
                }

            }

            let courseFinal = new courseModel(courseName, cricosCode, courseLevel,
                courseStudyModes, totalCreditPoints, courseLink, isAvailableOnline,
                prerequisites, semester, year)

            if (!jsonCourseData.includes(courseFinal)) {
                jsonCourseData.push(courseFinal)
                fs.writeFile('data.json', JSON.stringify(jsonCourseData), (err) => {
                    if (err) {
                        console.log(err);
                    }
                    console.log("JSON data is saved. ", courseFinal);
                });
                await browser.close();
                return true
            }
            await browser.close();
            return false
        }

    } catch (error) {
        console.log(error)
    }

    // })();

}