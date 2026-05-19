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

    return `
    
    <div class="item flex bg-[#F7F7F7] px-10 rounded-lg py-5 border border-[#D9D9D9] justify-between items-center">

        <div class="title">
            <p>${title}</p>
            <p class="text-sm text-[#0080FF]">Rp.${value}/kg</p>
        </div>

        <div class="flex items-center gap-20">

            <div class="flex items-center gap-4">

                <button class="minus border border-[#0080FF] px-3 py-2 rounded-md flex justify-center items-center">
                    <img class="w-4 h-4" src="icon/minus.svg" alt="">
                </button>

                <p class="weight semi text-sm text-[#0080FF] w-[50px] text-center">
                    ${weight} kg
                </p>

                <div class="flex gap-2">

                    <button class="plus border border-[#0080FF] px-3 py-2 rounded-md flex justify-center items-center">
                        <img class="w-4 h-4" src="icon/plus.svg" alt="">
                    </button>

                    <button class="delete bg-[#CE0000] px-3 py-2 rounded-md flex justify-center items-center">
                        <img class="w-4 h-4" src="icon/trash.svg" alt="">
                    </button>

                </div>
            </div>

            <div class="w-[120px] text-right">
                <p class="total">Rp. ${value}</p>
            </div>

        </div>
    </div>
    `;
}

function addItem(button, title){

    button.addEventListener("click", function(e){

        e.preventDefault();

        const value = parseInt(button.value);
        let itemChild = addItemChild(title, value, 1);

        itemParent.innerHTML += itemChild;

        button.disabled = true;
        button.classList.add("bg-[#0080FF]/20");
    });
}

addItem(express, "Cuci Express");
addItem(regular, "Cuci Regular");
addItem(gaun, "Dry Clean Gaun");
addItem(jas, "Dry Clean Jas");
addItem(setrika, "Setrika");

itemParent.addEventListener("click", function(e){

    const item = e.target.closest(".item");

    if(!item) return;

    const weight = item.querySelector(".weight");
    const total = item.querySelector(".total");
    let current = parseInt(weight.innerText);
    let priceText = item.querySelector(".title p:nth-child(2)").innerText;
    let value = parseInt(priceText.replace(/[^0-9]/g, ""));

    if(e.target.closest(".plus")){
        current++;
        weight.innerText = current + " kg";
        total.innerText = "Rp. " + (current * value);
    }

    if(e.target.closest(".minus")){

        if(current > 1){
            current--;
            weight.innerText = current + " kg";
            total.innerText = "Rp. " + (current * value);
        }
    }

    if(e.target.closest(".delete")){

        const title = item.querySelector(".title p").innerText;

        if(title === "Cuci Express"){
            express.disabled = false;
            express.classList.remove("bg-[#0080FF]/20");
        }

        if(title === "Cuci Regular"){
            regular.disabled = false;
            regular.classList.remove("bg-[#0080FF]/20");
        }

        if(title === "Dry Clean Gaun"){
            gaun.disabled = false;
            gaun.classList.remove("bg-[#0080FF]/20");
        }

        if(title === "Dry Clean Jas"){
            jas.disabled = false;
            jas.classList.remove("bg-[#0080FF]/20");
        }

        if(title === "Setrika"){
            setrika.disabled = false;
            setrika.classList.remove("bg-[#0080FF]/20");
        }

        item.remove();
    }
});