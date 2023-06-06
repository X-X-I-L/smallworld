import { DataSet, Network, Edge, Node } from "vis-network/standalone";
import "@fortawesome/fontawesome-free/js/fontawesome";
import "@fortawesome/fontawesome-free/js/solid";
import cardInfo from "../_data/CardInfo.json";
import { CardInfo, CardNode } from "./cardTypes.js";
import { capitalize } from "./helpers.js";
import Awesomplete from "awesomplete";

const ci = cardInfo as CardInfo;

const comparisonTypes = {
  //original colors used in previous script
  // type: { color: "yellow" },
  // attribute: { color: "white" },
  // level: { color: "lime" },
  // atk: { color: "red" },
  // def: { color: "cyan" },

  //colors generated from http://vrl.cs.brown.edu/color
  type: { color: "#9efa40" },
  attribute: { color: "#c2dcb8" },
  level: { color: "#f6adff" },
  atk: { color: "#ff7074" },
  def: { color: "#6a9fee" },
};

let cardIds: string[] = [];
let windowSearchParams: URLSearchParams;
type NetworkData = { nodes: DataSet<CardNode, "id">; edges: Edge[] };

function buildNetwork(): NetworkData {
  windowSearchParams = new URLSearchParams(window.location.search);
  cardIds = [...new Set(windowSearchParams.getAll("id"))];

  windowSearchParams.delete("id");
  let nodes = cardIds.map((id) => {
    windowSearchParams.append("id", id);
    let card = ci[id] as CardNode;
    card.title = card.name;
    card.id = id;
    card.shape = "circularImage";
    card.image = `_images/${id}.jpg`;
    card.brokenImage = "_images/misc/unknown_card.jpg";
    card.size = 40;
    card.borderWidth = 0;
    card.borderWidthSelected = 8;
    return card;
  });
  comparisonTypes;
  let edges: Edge[] = [];
  nodes.forEach((a, i) => {
    nodes.slice(i + 1).forEach((b) => {
      let matches = 0;
      let matchColor = "";
      let matchTitle = "";

      //forEach can't use break :(
      for (let [comparison, properties] of Object.entries(comparisonTypes)) {
        const comp = comparison as keyof CardNode;
        if (a[comp] === b[comp]) {
          matches += 1;
          matchColor = properties.color;
          matchTitle = `Same ${capitalize(comp)}`;
        }
      }

      if (matches == 1) {
        edges.push({
          from: a.id,
          to: b.id,
          color: matchColor,
          width: 6,
          title: matchTitle,
        });
      }
    });
  });

  return {
    nodes: new DataSet(nodes),
    edges: edges,
  };
}

function setupTitle() {
  let searchParams = new URLSearchParams(window.location.search);
  let title = searchParams.get("title");
  if (title) {
    document.title = title;
  }
}

let pickerSubmit = document.getElementById(
  "add-card-submit"
) as HTMLInputElement;

function setupCardPicker() {
  let nameList: string[] = [];
  let nameMap: { [name: string]: { id: string; popRank: number } } = {};
  Object.entries(ci).forEach(([id, card]) => {
    nameList.push(card.name);
    nameMap[card.name] = { id: id, popRank: card.popRank };
  });

  let cardPicker = document.getElementById(
    "add-card-picker"
  ) as HTMLInputElement;
  let awesompleter = new Awesomplete(cardPicker, {
    list: nameList,
    sort: (a, b) => {
      return nameMap[a.toString()].popRank - nameMap[b.toString()].popRank;
    },
    minChars: 0,
    maxItems: Math.floor(
      window.innerHeight / parseFloat(getComputedStyle(cardPicker).fontSize)
    ),
    filter: (text, input) => {
      if (
        cardIds.includes(
          nameMap[(text as unknown as { label: string; value: string }).value]
            .id
        )
      ) {
        return false;
      } else {
        return Awesomplete.FILTER_CONTAINS(text, input);
      }
    },
  });

  cardPicker.onfocus = (_ev) => {
    awesompleter.evaluate();
  };

  function currentCardTextIsValid() {
    return cardPicker.value.length > 0 && cardPicker.value in nameMap;
  }

  const ayuFg = getComputedStyle(cardPicker).getPropertyValue("--ayu-fg");
  const ayuFunc = getComputedStyle(cardPicker).getPropertyValue("--ayu-func");

  function onCardPickerInput(_ev: Event) {
    if (currentCardTextIsValid()) {
      pickerSubmit.style.display = "inline-block";
      cardPicker.style.color = ayuFunc;
    } else {
      pickerSubmit.style.display = "none";
      cardPicker.style.color = ayuFg;
    }

    cardPicker.style.width = `${
      cardPicker.value.length === 0
        ? cardPicker.placeholder.length
        : Math.max(6, cardPicker.value.length)
    }ch`;
  }

  function onCardPickerSubmit(ev: Event) {
    ev.preventDefault();
    if (!currentCardTextIsValid()) return;
    windowSearchParams.delete("title");
    windowSearchParams.append("id", nameMap[cardPicker.value].id);
    window.location.search = windowSearchParams.toString();
    onCardPickerInput(ev);
  }

  cardPicker.oninput = onCardPickerInput;
  onCardPickerInput(new CustomEvent("initialize"));

  let cardForm = document.getElementById("add-card-form") as HTMLFormElement;
  cardForm.onsubmit = onCardPickerSubmit;
  cardForm.addEventListener("awesomplete-selectcomplete", onCardPickerSubmit);
}
const resetNetworkButton = document.getElementById(
  "reset-network"
) as HTMLInputElement;
function setupResetButton() {
  resetNetworkButton.onclick = () => {
    window.location.search = "";
  };
}

function isHoveringResetButton() {
  return (
    resetNetworkButton.parentNode?.querySelector(":hover") == resetNetworkButton
  );
}

function setupNetworkInteraction(network: Network, data: NetworkData) {
  network.on("dragging", (params) => {
    if (isHoveringResetButton()) {
      data.nodes.update([
        {
          id: params.nodes[0],
          color: { highlight: "#ff0000ff" },
          opacity: 0.5,
        },
      ]);
    } else {
      data.nodes.update([
        {
          id: params.nodes[0],
          color: "",
          opacity: 1.0,
        },
      ]);
    }
  });
  network.on("dragEnd", (params) => {
    if (isHoveringResetButton()) {
      windowSearchParams.delete("id");
      cardIds.forEach((id) => {
        if (id != params.nodes[0]) {
          windowSearchParams.append("id", id);
        }
      });
      window.location.search = windowSearchParams.toString();
    } else {
      data.nodes.update([
        {
          id: params.nodes[0],
          color: "",
          opacity: 1.0,
        },
      ]);
    }
  });
}

export function main() {
  // create an array with nodes
  let data = buildNetwork();
  let container = document.getElementById("mynetwork");
  var network = new Network(container as HTMLElement, data, {
    physics: {
      forceAtlas2Based: {
        theta: 0.5,
        gravitationalConstant: -50,
        centralGravity: 0.01,
        springConstant: 0.08,
        springLength: 70,
        damping: 0.4,
        avoidOverlap: 0.2,
      },
      solver: "forceAtlas2Based",
    },
  });

  setupTitle();
  setupCardPicker();
  setupResetButton();
  setupNetworkInteraction(network, data);
}

main();
