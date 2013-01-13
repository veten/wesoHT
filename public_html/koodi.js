"use strict";
window.requestAnimFrame = (function() {
    return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function(/* kutsuttava funktio */callback, /* elementti */element) {
                window.setTimeout(callback, 1000 / 60);
            };
})();

var peli = {
    alusta: $("#alusta")[0].getContext("2d"),
    pelivaline: null,
    pistelista: [],
    pallo: null,
    peliLoppui: null,
    tiilit: null,
    aikalaskuri: null,
    pelinLoppumisAika: null,
    kokonaispisteet: 0,
    kertapisteet: null,
    vauhti: null,
    aaniIndeksi: 0,
    voitto: null,
    rata: 1,
    domain: {},
    pelaa: function() {
        peli.aikalaskuri++;
        if (!peli.peliLoppui) {
            if (peli.aikalaskuri === 5460) {
                $("#latausAani")[0].play();
            }
            if (peli.aikalaskuri === 5560) {
                peli.vauhti--;
            }
            if (peli.aikalaskuri % peli.vauhti === 0) {
                peli.pallo.siirra();
                peli.logiikka();
                peli.piirra();
            }
            if (peli.aikalaskuri % 3000 === 0 && peli.kertapisteet > 10) {
                peli.kertapisteet -= 10;
            }
        } else {
            peli.logiikka();
            peli.piirra();
        }
        requestAnimFrame(peli.pelaa);
    },
    alustus: function() {
        peli.aikalaskuri = 0;
        peli.pelinLoppumisAika = 0;
        peli.kertapisteet = 100;
        peli.vauhti = 3;
        peli.tiilit = [];
        peli.voitto = false;
        peli.pelivaline = new peli.domain.Pelivaline();
        peli.pallo = new peli.domain.Pallo();
        peli.peliLoppui = false;
        if (peli.rata === 1) {
            peli.luoTiilit();
        } else {
            peli.luoTiilit2();
        }
        peli.piirra();
        peli.pelaa();
        $("#pelimusa")[0].play();
    },
    logiikka: function() {
        if (!peli.peliLoppui) {
            peli.alusta.font = "20px Comic Sans MS";
            peli.alusta.fillStyle = "gold";
            peli.tarkistaTiileihinOsumat();
            peli.tarkistaPallonLiikkeet();
            peli.tarkistaMailaanOsuminen();
        } else {
            if (peli.aikalaskuri === (peli.pelinLoppumisAika + 80)) {
                if (peli.voitto) {
                    peli.alustus();
                } else {
                    $("#alusta").addClass("hidden");
                    $("#pelimusa")[0].pause();
                    $("#main").removeClass("hidden");
                    peli.teeLoppuSivu();
                }
            }
        }
    },
    piirra: function() {
        peli.alusta.clearRect(0, 0, 704, 480);
        peli.pallo.piirra();
        peli.alusta.fillStyle = "rgb(50, 50, 50)";
        peli.alusta.fillRect(0, 25, 704, 5);
        peli.alusta.fillStyle = "rgb(45, 45, 45)";
        peli.alusta.fillRect(0, 0, 704, 25);
        for (var i = 0; i < peli.tiilit.length; i++) {
            if (peli.tiilit[i].nakyva) {
                if (i % 3 === 0) {
                    peli.alusta.fillStyle = "rgb(110, 20, 110)";
                } else if (i % 2 === 0) {
                    peli.alusta.fillStyle = "rgb(20, 110, 110)";
                } else {
                    peli.alusta.fillStyle = "rgb(110, 110, 20)";
                }
                peli.alusta.fillRect(peli.tiilit[i].x, peli.tiilit[i].y, peli.tiilit[i].leveys, peli.tiilit[i].paksuus);
            }
        }
        peli.alusta.fillStyle = "rgb(150, 150, 150)";
        peli.alusta.fillText("Pisteet: " + peli.kokonaispisteet, 560, 20);
        peli.pelivaline.piirra();
//        console.log("kulma: " + peli.pallo.sivusuunta + ",  vauhti: " + peli.vauhti);
    },
    kohteenAlaosaanTormays: function(kohde) {
        if ((kohde.y + kohde.paksuus) === peli.pallo.y && kohde.x <= (peli.pallo.x + (2 * peli.pallo.sade)) && (kohde.x + kohde.leveys) >= peli.pallo.x && kohde.nakyva) {
            return true;
        }
        return false;
    },
    kohteenYlaosaanTormays: function(kohde) {
        if (kohde.y === (peli.pallo.y + (2 * peli.pallo.sade)) && kohde.x <= (peli.pallo.x + (2 * peli.pallo.sade)) && (kohde.x + kohde.leveys) >= peli.pallo.x && kohde.nakyva) {
            return true;
        }
        return false;
    },
    kohteenSivuunTormays: function(kohde) {
        if (((kohde.x + kohde.leveys) === peli.pallo.x || kohde.x === (peli.pallo.x + (2 * peli.pallo.sade))) && kohde.y <= (peli.pallo.y + (peli.pallo.sade * 2)) && (kohde.y + kohde.paksuus) >= peli.pallo.y && kohde.nakyva) {
            return true;
        }
        return false;
    },
    kohteensisalla: function(kohde) {
        if (kohde.x <= peli.pallo.x + (peli.pallo.sade * 2) && kohde.x + kohde.leveys >= peli.pallo.x && kohde.y + kohde.paksuus >= peli.pallo.y && kohde.y <= peli.pallo.y + (peli.pallo.sade * 2) && kohde.nakyva) {
            return true;
        } else {
            return false;
        }
    },
    teeTiiliAani: function() {
        for (var i = 10; i > 0; i--) {
            if (peli.aaniIndeksi % i === 0) {
                $("#tiiliAani" + i)[0].play();
                break;
            }
        }
        peli.aaniIndeksi++;
    },
    tarkistaTiileihinOsumat: function() {
        var tiilienMaara = 0;
        var pystyOsumat = 0;
        var sivuOsumat = 0;
        for (var i = 0; i < peli.tiilit.length; i++) {
            if (peli.kohteenAlaosaanTormays(peli.tiilit[i]) || peli.kohteenYlaosaanTormays(peli.tiilit[i]) || peli.kohteenSivuunTormays(peli.tiilit[i])) {
                peli.teeTiiliAani();
                if (peli.kohteenSivuunTormays(peli.tiilit[i])) {
                    sivuOsumat++;
                } else {
                    pystyOsumat++;
                }
                peli.tiilit[i].nakyva = false;
                peli.kokonaispisteet += peli.kertapisteet;
            } else if (peli.kohteensisalla(peli.tiilit[i])) {
                sivuOsumat++;
                peli.teeTiiliAani();
                peli.tiilit[i].nakyva = false;
                peli.kokonaispisteet += peli.kertapisteet;
            }
            if (peli.tiilit[i].nakyva) {
                tiilienMaara++;
            }
        }
        if (pystyOsumat > 0) {
            peli.pallo.kulkusuunta *= (-1);
        }
        if (sivuOsumat > 0) {
            peli.pallo.sivusuunta *= (-1);
        }
        if (tiilienMaara === 0) {
            peli.kokonaispisteet += 3000;
            peli.piirra();
            peli.alusta.fillText("Voitit!", 200, 200);
            peli.voitto = true;
            peli.peliLoppui = true;
            peli.rata++;
            $("#pelimusa")[0].pause();
            peli.pelinLoppumisAika = peli.aikalaskuri;
        }
    },
    tarkistaPallonLiikkeet: function() {
        if (peli.pallo.x <= 0 && peli.pallo.sivusuunta < 0) {
            peli.pallo.sivusuunta *= (-1);
            $("#seinaAani")[0].play();
        }
        if (peli.pallo.x + (2 * peli.pallo.sade) >= 700 && peli.pallo.sivusuunta > 0) {
            peli.pallo.sivusuunta *= (-1);
            $("#seinaAani")[0].play();
        }
        if ((peli.pallo.y - 10) > peli.pelivaline.y) {
            peli.alusta.fillStyle = "gold";
            peli.alusta.fillText("Peli loppui!", 200, 200);
            peli.peliLoppui = true;
            $("#tappioAani")[0].play();
            peli.pelinLoppumisAika = peli.aikalaskuri;
        }
        if (peli.pallo.y <= 30 && peli.pallo.kulkusuunta < 0) {
            peli.pallo.kulkusuunta *= (-1);
        }
    },
    tarkistaMailaanOsuminen: function() {
        if (peli.kohteenYlaosaanTormays(peli.pelivaline) || peli.kohteenSivuunTormays(peli.pelivaline)) {
            $("#mailaAani")[0].play();
            peli.pallo.kulkusuunta *= (-1);
            if ((peli.pallo.x + (2 * peli.pallo.sade)) < (peli.pelivaline.x + (peli.pelivaline.leveys * 0.25))) {
                peli.pallo.sivusuunta -= (2 - ((peli.pallo.x - peli.pelivaline.x) / (0.25 * peli.pelivaline.leveys)));
            }
            if (peli.pallo.x > (peli.pelivaline.x + (0.75 * peli.pelivaline.leveys))) {
                peli.pallo.sivusuunta += (2 - ((peli.pelivaline.x + peli.pelivaline.leveys - peli.pallo.x - (2 * peli.pallo.sade)) / (0.25 * peli.pelivaline.leveys)));
            }
        }
    },
    luoTiilit: function() {
        for (var a = 0; a < 2; a++) {
            for (var i = 0; i < 15; i++) {
                peli.tiilit.push(new peli.domain.Tiili(i * 45 + 5, a * 90 + 50));
                peli.tiilit.push(new peli.domain.Tiili(i * 45 + 25, a * 90 + 70));
                peli.tiilit.push(new peli.domain.Tiili(i * 45 + 5, a * 90 + 90));
            }
        }
    },
    luoTiilit2: function() {
        for (var a = 0; a < 2; a++) {
            for (var i = 0; i < 15; i++) {
                peli.tiilit.push(new peli.domain.Tiili(i * 45 + 5, a * 70 + 100));
                peli.tiilit.push(new peli.domain.Tiili(i * 45 + 25, a * 70 + 150));
                peli.tiilit.push(new peli.domain.Tiili(i * 45 + 5, a * 70 + 190));
            }
        }
    },
    teeLoppuSivu: function() {

        var dataToSend = JSON.stringify({
            score: peli.kokonaispisteet
        });

        $.ajax({
            url: "http://aqueous-ravine-5531.herokuapp.com/app/games/4/scores/",
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            type: 'post',
            data: dataToSend

        });

        $.getJSON("http://aqueous-ravine-5531.herokuapp.com/app/games/4/scores/", function(data) {
            $.each(data, function(indeksi, datata) {
                peli.pistelista.push(datata.score);
            });

            document.getElementById("omaTulos").innerHTML = "Pisteesi: " + peli.kokonaispisteet;
            document.getElementById("tulosLista").innerHTML = "Huippupisteet:";
            for (var q = 0; q < peli.valitseViisiParasta().length; q++) {
                document.getElementById("lista" + (q + 1)).innerHTML = peli.valitseViisiParasta()[q];
            }
        });

    },
    valitseViisiParasta: function() {
        var palautettava = [];
        var sadat = [];
        var tuhannet = [];
        var kymmenetTuhannet = [];
        for (var a = 0; a < peli.pistelista.length; a++) {
            if (peli.pistelista[a] > 9999) {
                kymmenetTuhannet.push(peli.pistelista[a]);
            } else if (peli.pistelista[a] > 999) {
                tuhannet.push(peli.pistelista[a]);
            } else {
                sadat.push(peli.pistelista[a]);
            }
        }
        kymmenetTuhannet.sort();
        kymmenetTuhannet.reverse();
        tuhannet.sort();
        tuhannet.reverse();
        sadat.sort();
        sadat.reverse();
        for (var i = 0; i < kymmenetTuhannet.length; i++) {
            palautettava.push(kymmenetTuhannet[i]);
        }
        for (var i = 0; i < tuhannet.length; i++) {
            palautettava.push(tuhannet[i]);
        }
        for (var i = 0; i < sadat.length; i++) {
            palautettava.push(sadat[i]);
        }
        return palautettava.slice(0, 5);
    }
};

peli.domain.Pelivaline = function() {
    this.x = 302;
    this.y = 450;
    this.leveys = 80;
    this.paksuus = 10;
    this.nakyva = true;
};
peli.domain.Pelivaline.prototype.piirra = function() {
    if (!peli.voitto && peli.peliLoppui) {
        for (var a = 0; a <= 30; a += 10) {
            for (var i = 0; i <= 80; i += 20) {
                peli.alusta.fillStyle = "rgb(150, 150, 150)";
                peli.alusta.fillRect(this.x + i, this.y + a, 5, 5);
                peli.alusta.fillStyle = "red";
                peli.alusta.fillRect(this.x + i + 10, this.y + a + 3, 3, 3);
                peli.alusta.fillStyle = "yellow";
                peli.alusta.fillRect(this.x + i - 10, this.y + a - 3, 2, 2);
            }
        }
    } else {
        peli.alusta.fillStyle = "rgb(150, 150, 150)";
        peli.alusta.fillRect(this.x + (this.leveys / 4), this.y, this.leveys / 2, this.paksuus);
        peli.alusta.fillStyle = "red";
        peli.alusta.fillRect(this.x + 5, this.y, 15, this.paksuus);
        peli.alusta.fillRect(this.x + (this.leveys * 0.75), this.y, 15, this.paksuus);
        peli.alusta.beginPath();
        peli.alusta.arc(this.x + 5, this.y + this.paksuus / 2, 4, 0.5 * Math.PI, 1.5 * Math.PI);
        peli.alusta.stroke();
        peli.alusta.fill();
        peli.alusta.closePath();
        peli.alusta.beginPath();
        peli.alusta.arc(this.x + 75, this.y + this.paksuus / 2, 4, 1.5 * Math.PI, 2.5 * Math.PI);
        peli.alusta.stroke();
        peli.alusta.fill();
        peli.alusta.closePath();
    }
};
peli.domain.Pelivaline.prototype.siirra = function() {
    if (!peli.peliLoppui) {
        if (keyhandler.right() && this.x < 700 - this.leveys) {
            this.x += 20;
        }
        if (keyhandler.left() && this.x > 2) {
            this.x -= 20;
        }
    }
};
peli.domain.Pallo = function() {
    this.x = 300;
    this.y = 350;
    this.sade = 5;
    this.sivusuunta = 1;
    this.kulkusuunta = 5;
};
peli.domain.Pallo.prototype.piirra = function() {
    peli.alusta.fillStyle = "rgb(0, 0, 0)";
    peli.alusta.beginPath();
    peli.alusta.arc(this.x + (2 * this.sade), this.y + this.sade, this.sade, 0, 2 * Math.PI);
    peli.alusta.stroke();
    peli.alusta.fillStyle = "rgb(255, 255, 255)";
    peli.alusta.fill();
    peli.alusta.closePath();
};
peli.domain.Pallo.prototype.siirra = function() {
    this.y += this.kulkusuunta;
    this.x += this.sivusuunta;
};
peli.domain.Tiili = function(x, y) {
    this.x = x;
    this.y = y;
    this.paksuus = 15;
    this.leveys = 40;
    this.nakyva = true;
};

$(document).keyup(function(eventInfo) {
    keyhandler.keyup(eventInfo.which);
    eventInfo.preventDefault();
});
$(document).keydown(function(eventInfo) {
    keyhandler.keydown(eventInfo.which);
    peli.pelivaline.siirra();
    eventInfo.preventDefault();
});

$(document).ready(function() {
    var piirtoalusta = $("#lataus")[0].getContext("2d");
    piirtoalusta.fillStyle = "darkslategrey";
    var xKohta = 0;
    $("#latausAani")[0].play();
    setInterval(function() {
        piirtoalusta.fillRect(xKohta, 0, 20, 20);
        if (xKohta === 400) {
            $("#alkusivu").addClass("hidden");
            $("#alusta").removeClass("hidden");
            peli.alustus();
        }
        if (xKohta === 100) {
            $("#latausAani2")[0].play();
        }
        if (xKohta === 200) {
            $("#latausAani3")[0].play();
        }
        xKohta += 20;
    }, 500);
});

