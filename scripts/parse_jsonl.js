const fs = require('fs');
const readline = require('readline');

async function processFile() {
    const rs = fs.createReadStream('sotercare_recording_20260308_195017.jsonl');
    const rl = readline.createInterface({ input: rs });

    const records = [];

    for await (const line of rl) {
        if (!line.trim()) continue;
        try {
            const data = JSON.parse(line);
            // Data expected structure: 
            // { temp: string, moisture: string, gTotal: string, gaitLabel: string, fallAlert: string }
            records.push({
                temp: parseFloat(data.temp),
                ambientTemp: parseFloat(data.ambientTemp),
                moisture: parseFloat(data.moisture), // Note: user mentioned this doesn't simulate, we'll see if it changes later in the file.
                gTotal: parseFloat(data.gTotal),
                gaitLabel: data.gaitLabel,
            });

            // Stop after parsing roughly a timeline size (e.g. 500 events) for UI mock
            if (records.length > 500) { break; }
        } catch (e) {
            console.error(e);
        }
    }

    // Check if moisture ever varies
    let hasMoistureData = false;
    for (let i = 0; i < records.length; i++) {
        if (records[i].moisture > 0) {
            hasMoistureData = true;
            break;
        }
    }

    console.log(`Parsed ${records.length} records.`);
    console.log(`Does moisture vary > 0 ? ${hasMoistureData}`);

    fs.writeFileSync('patientData.json', JSON.stringify(records, null, 2));
    console.log('Saved to patientData.json');
}

processFile();
