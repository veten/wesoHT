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
    kokonaispisteet: null,
    kertapisteet: null,
    vauhti: null,
    aaniIndeksi: 0,
    domain: {},
    pelaa: function() {
        peli.aikalaskuri++;
        if (!peli.peliLoppui) {
            if (peli.aikalaskuri % 8000 === 0 && peli.vauhti > 1) {
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
        }
        requestAnimFrame(peli.pelaa);
    },
    alustus: function() {
        peli.aikalaskuri = 0;
        peli.pelinLoppumisAika = 0;
        peli.kokonaispisteet = 0;
        peli.kertapisteet = 100;
        peli.vauhti = 3;
        peli.tiilit = [];
        peli.pelivaline = new peli.domain.Pelivaline();
        peli.pallo = new peli.domain.Pallo();
        peli.peliLoppui = false;
        peli.luoTiilit();
        peli.piirra();
        peli.pelaa();
        $("#pelimusa")[0].play();
    },
    logiikka: function() {
        if (!peli.peliLoppui) {
            peli.alusta.font = "30px Comic Sans MS";
            peli.alusta.fillStyle = "gold";
            peli.tarkistaTiileihinOsumat();
            peli.tarkistaPallonLiikkeet();
            peli.tarkistaMailaanOsuminen();
        } else {
            if (peli.aikalaskuri === (peli.pelinLoppumisAika + 80)) {
                $("#alusta").addClass("hidden");
                $("#pelimusa")[0].pause();
                $("#main").removeClass("hidden");
                peli.teeLoppuSivu();
            }
        }
    },
    piirra: function() {
        if (!peli.peliLoppui) {
            peli.alusta.clearRect(0, 0, 704, 480);
            peli.pallo.piirra();
            peli.pelivaline.piirra();
            for (var i = 0; i < peli.tiilit.length; i++) {
                if (peli.tiilit[i].nakyva) {
                    if (i < 33) {
                        peli.alusta.fillStyle = "rgb(110, 20, 110)";
                    } else if (i < 66) {
                        peli.alusta.fillStyle = "rgb(20, 110, 110)";
                    } else {
                        peli.alusta.fillStyle = "rgb(110, 110, 20)";
                    }
                    peli.alusta.fillRect(peli.tiilit[i].x, peli.tiilit[i].y, peli.tiilit[i].leveys, peli.tiilit[i].paksuus);
                }
            }
        }
        peli.alusta.fillStyle = "rgb(150, 150, 150)";
        peli.alusta.fillText("Pisteet: " + peli.kokonaispisteet, 500, 30);
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
    teeTiiliAani: function() {
        if (peli.aaniIndeksi % 10 === 0) {
            $("#tiiliAani10")[0].play();
        } else if (peli.aaniIndeksi % 9 === 0) {
            $("#tiiliAani9")[0].play();
        } else if (peli.aaniIndeksi % 8 === 0) {
            $("#tiiliAani8")[0].play();
        } else if (peli.aaniIndeksi % 7 === 0) {
            $("#tiiliAani7")[0].play();
        } else if (peli.aaniIndeksi % 6 === 0) {
            $("#tiiliAani6")[0].play();
        } else if (peli.aaniIndeksi % 5 === 0) {
            $("#tiiliAani5")[0].play();
        } else if (peli.aaniIndeksi % 4 === 0) {
            $("#tiiliAani4")[0].play();
        } else if (peli.aaniIndeksi % 3 === 0) {
            $("#tiiliAani3")[0].play();
        } else if (peli.aaniIndeksi % 2 === 0) {
            $("#tiiliAani2")[0].play();
        } else {
            $("#tiiliAani1")[0].play();
        }
        peli.aaniIndeksi++;
    },
    tarkistaTiileihinOsumat: function() {
        var tiilienMaara = 0;
        var useammanTiilenOsuma = 0;
        for (var i = 0; i < peli.tiilit.length; i++) {
            if (peli.kohteenAlaosaanTormays(peli.tiilit[i]) || peli.kohteenYlaosaanTormays(peli.tiilit[i]) || peli.kohteenSivuunTormays(peli.tiilit[i])) {
                peli.teeTiiliAani();
                if (peli.kohteenSivuunTormays(peli.tiilit[i])) {
                    peli.pallo.kulkusuunta *= (-1);
                    peli.pallo.sivusuunta *= (-1);
                }
                peli.tiilit[i].nakyva = false;
                peli.pallo.kulkusuunta *= (-1);
                useammanTiilenOsuma++;
                peli.kokonaispisteet += peli.kertapisteet;
            }
            if (peli.tiilit[i].nakyva) {
                tiilienMaara++;
            }
        }
        if (useammanTiilenOsuma % 2 === 0 && useammanTiilenOsuma !== 0) {
            peli.pallo.kulkusuunta *= (-1);
        }
        if (tiilienMaara === 0) {
            peli.kokonaispisteet += 3000;
            peli.piirra();
            peli.alusta.fillText("Voitit!", 200, 200);
            peli.peliLoppui = true;
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
        if (peli.pallo.y === 0) {
            peli.pallo.kulkusuunta *= (-1);
        }
    },
    tarkistaMailaanOsuminen: function() {
        if (peli.kohteenYlaosaanTormays(peli.pelivaline)) {
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
                peli.tiilit.push(new peli.domain.Tiili(i * 45 + 5, a * 70 + 50));
                peli.tiilit.push(new peli.domain.Tiili(i * 45 + 25, a * 70 + 70));
                peli.tiilit.push(new peli.domain.Tiili(i * 45 + 5, a * 70 + 90));
            }
        }
    },
    teeLoppuSivu: function() {
        var dataToSend = JSON.stringify({
            score: peli.kokonaispisteet
        });

        $.ajax({
            url: "http://aqueous-ravine-5531.herokuapp.com/app/games/2/scores/",
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            type: 'post',
            data: dataToSend
        });

        $.getJSON("http://aqueous-ravine-5531.herokuapp.com/app/games/2/scores/", function(data) {
            $.each(data, function(indeksi, datata) {
                peli.pistelista.push(datata.score);
            });

            document.getElementById("spanTulos").innerHTML = "Pisteesi: " + peli.kokonaispisteet;
            document.getElementById("spanLista").innerHTML = "Huippupisteet:";
            for (var q = 0; q < peli.valitseViisiParasta().length; q++) {
                document.getElementById("span" + (q + 1)).innerHTML = peli.valitseViisiParasta()[q];
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
};
peli.domain.Pelivaline.prototype.siirra = function() {
    if (keyhandler.right() && this.x < 700 - this.leveys) {
        this.x += 20;
    }
    if (keyhandler.left() && this.x > 2) {
        this.x -= 20;
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
        if (xKohta === 220) {
            $("#alkusivu").addClass("hidden");
            $("#alusta").removeClass("hidden");
            peli.alustus();
        }
        xKohta += 20;
    }, 500);
});

