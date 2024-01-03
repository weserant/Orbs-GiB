// ==UserScript==
// @name         Anthelion Orbs/GiB Adoption Extension
// @namespace    http://tampermonkey.net/
// @version      2024-01-01
// @description  Adds a column to the Adoptable Torrents page displaying the orbs per GiB for adoptable torrents.
// @author       weser
// @match        https://anthelion.me/torrents.php?*type=adoption
// @icon         https://anthelion.me/favicon.ico
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Variable to keep track of sorting order (1 for descending, -1 for ascending)
    let sortDirection = -1;
    addOrbRatio();

    function addOrbRatio() {
        const rows = document.querySelectorAll('#content > div > div.box > table > tbody > tr');

        rows.forEach((row, index) => {
            const cell = document.createElement('td');

            // Create the title "Orbs/GiB" for the first row
            if (index === 0) {
                const link = document.createElement('a');
                link.innerText = 'Orbs/GiB';
                link.className = 'sign';
                link.href = '#';
                addEventListeners(link);
                cell.append(link);
                cell.style.textAlign = 'center';
            }
            // Calculate and create the ratio for each row
            else {
                const size = convertSizeToGiB(row.querySelector('td:nth-child(2)').textContent);
                const bounty = parseInt(row.querySelector('td:nth-child(3)').textContent.replace(/,/g, ''));
                cell.innerText = parseInt(bounty/size).toLocaleString();
                cell.style.textAlign = 'right';
            }
            row.insertBefore(cell, row.children[3]);
        });
    }

    function convertSizeToGiB(sizeWithUnit) {
        const sizeMap = {
            'KiB': 1 / (1024 * 1024),
            'MiB': 1 / 1024,
            'GiB': 1,
            'TiB': 1024
        };

        const match = sizeWithUnit.match(/^([\d.]+)\s*(\w+)$/); // regex to extract value and unit
        const sizeInGiB = parseFloat(match[1]) * sizeMap[match[2]]
        return sizeInGiB;
    }

    function sortTableByRatio() {
        // Toggle sorting order
        sortDirection *= -1;

        const table = document.querySelector('#content > div > div.box > table');
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.children).slice(1); // Exclude the first row (title)

        // Sort rows based on ratios and sorting order
        rows.sort((a, b) => {
            const ratioA = parseInt(a.children[3].textContent.replace(/,/g, ''));
            const ratioB = parseInt(b.children[3].textContent.replace(/,/g, ''));
            return sortDirection * (ratioB - ratioA);
        });

        // Create a new table body with sorted rows
        const newTbody = document.createElement('tbody');
        newTbody.appendChild(table.rows[0].cloneNode(true));
        rows.forEach(row => newTbody.appendChild(row.cloneNode(true)));

        // Replace the existing table body with the sorted one, update the sorting indicator and re-add the event listeners
        tbody.replaceWith(newTbody);
        const titleRow = newTbody.querySelector('tr.colhead');
        titleRow.querySelectorAll('td').forEach(cell => {
            cell.innerHTML = cell.innerHTML.replace(' ↓', '').replace(' ↑', '');
        });
        const titleCell = titleRow.querySelector('td:nth-child(4)');
        titleCell.innerHTML = titleCell.innerHTML.replace('Orbs/GiB',`${sortDirection === 1 ? 'Orbs/GiB ↓' : 'Orbs/GiB ↑'}`);
        addEventListeners(titleCell);
    }

    function addEventListeners(cell) {
        cell.addEventListener('click', function(event) {
            event.preventDefault();
            sortTableByRatio();
        });
    }
})();
