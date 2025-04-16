let arr = [];
let name = 1;
setInterval(() => {
    let now = Date.now();
    let d = new Date();
    let year = d.getFullYear();
    let month = d.getMonth();
    let dat = d.getDate()
    console.log(dat,year,month,now.toLocaleString())
    arr.push({name:now});
    console.log(arr);
    if(name > 3){
        console.log(now===arr[2],now === now)
    }
    name++;
},3000);
