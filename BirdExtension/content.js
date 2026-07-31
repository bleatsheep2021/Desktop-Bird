let birds = [];

let birdColour = "blue";
let birdCount = 1;

// Debug: when true, birds always head to the bottom of the
// screen to land instead of flying around randomly.
let autoLand = false;

// Base speed birds travel at while flying (pixels per tick).
// Each bird gets its own randomized speed near this value so
// they don't all move in lockstep.
const FLY_SPEED = 3;

// How much a bird's individual speed can vary from FLY_SPEED
const FLY_SPEED_VARIANCE = 1.5;

// Chance (0-1) that a bird decides to land at the bottom after
// finishing a flight leg, instead of choosing a new flight target.
// Lower this to make perching rarer.
const LAND_CHANCE = 0.12;

// Peck animation - plays while a bird is perched at the bottom.
// The peck row only has 3 frames (columns 0-2) on the sprite sheet.
// The peck row is in a different position per colour sprite sheet:
// blue = 3rd line, brown = 4th line (rows are 0-indexed, 16px each).
const PECK_FRAMES = [0, 1, 2];
const PECK_ROW_Y = {
    blue: -32,
    brown: -48
};



function setSprite(b) {

    b.element.style.backgroundImage =
        "url('" +
        chrome.runtime.getURL(
            "birds/" + birdColour + "_bird.png"
        )
        + "')";

}





function createBird() {


    const element = document.createElement("div");

    element.className = "bird";

    document.body.appendChild(element);



    element.style.position = "fixed";
    element.style.width = "16px";
    element.style.height = "16px";
    element.style.backgroundRepeat = "no-repeat";
    element.style.imageRendering = "pixelated";



    let b = {

        element: element,

        x: Math.random() * window.innerWidth,

        y: Math.random() * window.innerHeight * 0.7,


        lastX: 0,


        targetX: null,

        targetY: null,


        state: "flying",


        // Each bird gets its own speed so multiple birds don't
        // all travel at the exact same rate

        speed:
            FLY_SPEED +
            (Math.random() * FLY_SPEED_VARIANCE * 2 - FLY_SPEED_VARIANCE),


        // Randomize the starting animation frame so wing-flaps
        // aren't perfectly synced between birds

        frame: Math.floor(Math.random() * 8),


        // Tracks which frame of the peck animation is showing
        // while the bird is perched

        peckFrame: 0,


        idleTimer: Date.now(),


        // Tracks how long the bird has been perched, separate
        // from idleTimer (which drives the peck animation)

        landTimer: Date.now()


    };



    setSprite(b);


    chooseNewFlight(b);


    return b;

}







function createBirds(amount) {


    birds.forEach(b => {

        b.element.remove();

    });



    birds = [];



    for(let i = 0; i < amount; i++) {

        birds.push(
            createBird()
        );

    }

}







chrome.storage.sync.get(
[
"birdColour",
"birdCount",
"autoLand"
],
(result)=>{


    birdColour =
        result.birdColour || "blue";


    birdCount =
        result.birdCount || 1;


    autoLand =
        result.autoLand || false;



    createBirds(birdCount);


});








chrome.runtime.onMessage.addListener(
(message)=>{


    if(message.type==="birdColour"){

        birdColour = message.value;

        birds.forEach(setSprite);

    }



    if(message.type==="birdCount"){

        createBirds(message.value);

    }



    if(message.type==="forceLand"){

        birds.forEach(landBottom);

    }



    if(message.type==="autoLand"){

        autoLand = message.value;


        if(autoLand){

            birds.forEach(landBottom);

        }

    }


});








function chooseNewFlight(b) {


    // Random point in upper screen

    b.targetX =
        Math.random() *
        window.innerWidth;


    b.targetY =
        Math.random() *
        (window.innerHeight * 0.75);



    b.state = "flying";


}








function landBottom(b) {


    b.targetX =
        Math.random() *
        window.innerWidth;


    b.targetY =
        window.innerHeight - 50;


    b.state = "landing";


}








setInterval(()=>{


birds.forEach(b=>{


    if(
        b.state==="flying" ||
        b.state==="landing"
    ){



        let dx =
            b.targetX - b.x;


        let dy =
            b.targetY - b.y;


        let dist =
            Math.sqrt(dx * dx + dy * dy);



        if(dist <= b.speed){

            // Reached the target this tick - snap to it and
            // immediately pick the next action, so the bird
            // never pauses or hovers in mid-air.

            b.x = b.targetX;

            b.y = b.targetY;



            if(b.state==="landing") {


                b.state="perched";


                b.idleTimer =
                    Date.now();


                b.landTimer =
                    Date.now();


            }

            else {


                // Decide next action - always land if the
                // Auto Land debug option is on, otherwise
                // randomly decide as usual

                if(autoLand || Math.random()<LAND_CHANCE){

                    landBottom(b);

                }
                else {

                    chooseNewFlight(b);

                }


            }


        }

        else {


            // Move at this bird's own constant speed toward the target

            b.x += (dx / dist) * b.speed;

            b.y += (dy / dist) * b.speed;


        }





        // Flying animation

        b.frame++;


        if(b.frame>=8)
            b.frame=0;



        b.element.style.backgroundPosition =
            `${b.frame*-16}px -16px`;





        // Direction flip

        if(b.x>b.lastX){


            b.element.style.transform =
            "scale(4) scaleX(-1)";


        }

        else if(b.x<b.lastX){


            b.element.style.transform =
            "scale(4) scaleX(1)";


        }



    }




    else if(b.state==="perched"){



        // Peck animation - cycles through frames 1-3 on the
        // bottom row of the sprite sheet

        if(
            Date.now()-b.idleTimer > 400
        ){


            b.peckFrame =
                (b.peckFrame + 1) % PECK_FRAMES.length;


            b.element.style.backgroundPosition =
                `${PECK_FRAMES[b.peckFrame] * -16}px ${PECK_ROW_Y[birdColour]}px`;



            b.idleTimer =
                Date.now();


        }





        // Take off after a while

        if(
            Date.now()-b.landTimer >
            4000 + Math.random()*5000
        ){


            if(autoLand){

                landBottom(b);

            }
            else {

                chooseNewFlight(b);

            }


        }


    }



    b.lastX=b.x;



    b.element.style.left =
        b.x+"px";


    b.element.style.top =
        b.y+"px";



});


},100);









window.addEventListener(
"scroll",
()=>{


    birds.forEach(b=>{


        // Give each bird a slightly different reaction delay so
        // they don't all veer off in unison

        setTimeout(()=>{

            chooseNewFlight(b);

        }, Math.random() * 400);


    });


});