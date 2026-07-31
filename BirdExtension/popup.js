function updateSetting(type, value) {


    chrome.storage.sync.set({
        [type]: value
    });


    chrome.tabs.query(
        {
            active:true,
            currentWindow:true
        },
        (tabs)=>{


            chrome.tabs.sendMessage(
                tabs[0].id,
                {
                    type:type,
                    value:value
                }
            );


        }
    );

}



document.getElementById("blue").onclick = () => {

    updateSetting(
        "birdColour",
        "blue"
    );

};



document.getElementById("brown").onclick = () => {

    updateSetting(
        "birdColour",
        "brown"
    );

};





document.getElementById("count").onchange = (event)=>{


    updateSetting(
        "birdCount",
        Number(event.target.value)
    );


};





document.getElementById("forceLand").onclick = () => {


    chrome.tabs.query(
        {
            active:true,
            currentWindow:true
        },
        (tabs)=>{


            chrome.tabs.sendMessage(
                tabs[0].id,
                {
                    type:"forceLand"
                }
            );


        }
    );


};



document.getElementById("autoLand").onchange = (event)=>{


    updateSetting(
        "autoLand",
        event.target.checked
    );


};




// Restore the Auto Land checkbox state when the popup opens

chrome.storage.sync.get(
    ["autoLand"],
    (result)=>{


        document.getElementById("autoLand").checked =
            result.autoLand || false;


    }
);