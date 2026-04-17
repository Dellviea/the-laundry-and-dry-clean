const express = document.getElementById("express");
express.value = 8000;
const regular = document.getElementById("regular");
regular.value = 5000;
const gaun = document.getElementById("gaun");
gaun.value = 30000;
const jas = document.getElementById("jas");
jas.value = 25000;
const setrika = document.getElementById("setrika");
setrika.value = 3000;

const itemParent = document.getElementById("item");

function addItemChild(title, value, weight){
    let itemChild = 
        `<div class="flex bg-[#F7F7F7] px-10 rounded-lg py-5 border border-[#D9D9D9] justify-between">
            <div class="title">
                <p class="">${title}</p>
                <p class="text-sm text-[#0080FF]">Rp.${value}/kg</p>
            </div>
            <div class="flex justify-center items-center gap-20">
                <div class="flex justify-center items-center gap-4">
                    <button class="minus border border-[#0080FF] text-white px-3 py-2 rounded-md flex justify-center items-center">
                        <img class="w-4 h-4" src="icon/minus.svg" alt="">
                    </button>
                    <p class="semi text-sm text-[#0080FF]">${weight} kg</p>
                    <div class="flex gap-2">
                        <button id="plus" class="plus border border-[#0080FF] text-white px-3 py-2 rounded-md flex justify-center items-center">
                            <img class="w-4 h-4" src="icon/plus.svg" alt="">
                        </button>
                        <button id="delete" class="bg-[#CE0000] text-white px-3 py-2 rounded-md flex justify-center items-center">
                            <img class="w-4 h-4" src="icon/trash.svg" alt="">
                        </button>
                    </div>
                </div>
                <div>
                    <p id="total">Rp. ${value}</p>
                </div>
            </div>
        </div>`
    
    return itemChild;
}

express.addEventListener('click', function(e) {
    e.preventDefault();

    const value = express.value;

    let itemChild = addItemChild("Cuci Express", value, 1 , 0);
    itemParent.innerHTML += itemChild;

    const plusBtn = document.querySelectorAll(".plus");

    plusBtn.forEach(btn => {
        btn.onclick = () => {
            let text = btn.parentElement.parentElement.querySelector("p");
            let current = parseInt(text.innerText);
            text.innerText = (current + 1) + " kg";

            let total = document.getElementById("total");
            let currentTot = parseInt(total.innerText);
            let newVal = current + 1
            total.innerText = "Rp. "+ (newVal * value);
        };
    });

    const minusBtn = document.querySelectorAll(".minus");

    minusBtn.forEach(btn => {
        btn.onclick = () => {
            let text = btn.parentElement.parentElement.querySelector("p");
            let current = parseInt(text.innerText);
            if (current > 1){
                
                text.innerText = (current + -1) + " kg";

                let total = document.getElementById("total");
                let currentTot = parseInt(total.innerText);
                let newVal = current + -1
                total.innerText = "Rp. "+ (newVal * value);
            }
        };
    });


    express.disabled = true;
});

regular.addEventListener('click', function(e) {
    e.preventDefault();

    const value = regular.value;

    let itemChild = addItemChild("Cuci Reguler", value, 1);
    itemParent.innerHTML += itemChild;

    const plusBtn = document.querySelectorAll(".plus");

    plusBtn.forEach(btn => {
        btn.onclick = () => {
            let text = btn.parentElement.parentElement.querySelector("p");
            let current = parseInt(text.innerText);
            text.innerText = (current + 1) + " kg";

            let total = document.getElementById("total");
            let currentTot = parseInt(total.innerText);
            let newVal = current + 1
            total.innerText = "Rp. "+ (newVal * value);
        };
    });

    const minusBtn = document.querySelectorAll(".minus");

    minusBtn.forEach(btn => {
        btn.onclick = () => {
            let text = btn.parentElement.parentElement.querySelector("p");
            let current = parseInt(text.innerText);
            if (current > 1){
                
                text.innerText = (current + -1) + " kg";

                let total = document.getElementById("total");
                let currentTot = parseInt(total.innerText);
                let newVal = current + -1
                total.innerText = "Rp. "+ (newVal * value);
            }
        };
    });


    regular.disabled = true;
});

gaun.addEventListener('click', function(e) {
    e.preventDefault();

    const value = gaun.value;

    let itemChild = addItemChild("Dry Clean Gaun", value, 1);
    itemParent.innerHTML += itemChild;

    const plusBtn = document.querySelectorAll(".plus");

    plusBtn.forEach(btn => {
        btn.onclick = () => {
            let text = btn.parentElement.parentElement.querySelector("p");
            let current = parseInt(text.innerText);
            text.innerText = (current + 1) + " kg";

            let total = document.getElementById("total");
            let currentTot = parseInt(total.innerText);
            let newVal = current + 1
            total.innerText = "Rp. "+ (newVal * value);
        };
    });

    const minusBtn = document.querySelectorAll(".minus");

    minusBtn.forEach(btn => {
        btn.onclick = () => {
            let text = btn.parentElement.parentElement.querySelector("p");
            let current = parseInt(text.innerText);
            if (current > 1){
                
                text.innerText = (current + -1) + " kg";

                let total = document.getElementById("total");
                let currentTot = parseInt(total.innerText);
                let newVal = current + -1
                total.innerText = "Rp. "+ (newVal * value);
            }
        };
    });


    gaun.disabled = true;
});

jas.addEventListener('click', function(e) {
    e.preventDefault();

    const value = jas.value;

    let itemChild = addItemChild("Dry Clean Jas", value, 1);
    itemParent.innerHTML += itemChild;

    const plusBtn = document.querySelectorAll(".plus");

    plusBtn.forEach(btn => {
        btn.onclick = () => {
            let text = btn.parentElement.parentElement.querySelector("p");
            let current = parseInt(text.innerText);
            text.innerText = (current + 1) + " kg";

            let total = document.getElementById("total");
            let currentTot = parseInt(total.innerText);
            let newVal = current + 1
            total.innerText = "Rp. "+ (newVal * value);
        };
    });

    const minusBtn = document.querySelectorAll(".minus");

    minusBtn.forEach(btn => {
        btn.onclick = () => {
            let text = btn.parentElement.parentElement.querySelector("p");
            let current = parseInt(text.innerText);
            if (current > 1){
                
                text.innerText = (current + -1) + " kg";

                let total = document.getElementById("total");
                let currentTot = parseInt(total.innerText);
                let newVal = current + -1
                total.innerText = "Rp. "+ (newVal * value);
            }
        };
    });


    jas.disabled = true;
});

setrika.addEventListener('click', function(e) {
    e.preventDefault();

    const value = setrika.value;

    let itemChild = addItemChild("Setrika", value, 1);
    itemParent.innerHTML += itemChild;

    const plusBtn = document.querySelectorAll(".plus");

    plusBtn.forEach(btn => {
        btn.onclick = () => {
            let text = btn.parentElement.parentElement.querySelector("p");
            let current = parseInt(text.innerText);
            text.innerText = (current + 1) + " kg";

            let total = document.getElementById("total");
            let currentTot = parseInt(total.innerText);
            let newVal = current + 1
            total.innerText = "Rp. "+ (newVal * value);
        };
    });

    const minusBtn = document.querySelectorAll(".minus");

    minusBtn.forEach(btn => {
        btn.onclick = () => {
            let text = btn.parentElement.parentElement.querySelector("p");
            let current = parseInt(text.innerText);
            if (current > 1){
                
                text.innerText = (current + -1) + " kg";

                let total = document.getElementById("total");
                let currentTot = parseInt(total.innerText);
                let newVal = current + -1
                total.innerText = "Rp. "+ (newVal * value);
            }
        };
    });


    setrika.disabled = true;
});