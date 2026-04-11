import "./main";
import CTFd from "../compat/CTFd";
import $ from "jquery";
import "../compat/json";
import { ezAlert } from "../compat/ezq";
import echarts from "echarts/dist/echarts.common";
import dayjs from "dayjs";
import { colorHash } from "../compat/styles";
import { cumulativeSum } from "../compat/math";

const api_func = {
  users: (x, y) => CTFd.api.patch_user_public({ userId: x }, y),
  teams: (x, y) => CTFd.api.patch_team_public({ teamId: x }, y),
};

function toggleAccount() {
  const $btn = $(this);
  const id = $btn.data("account-id");
  const state = $btn.data("state");
  let hidden = undefined;
  if (state === "visible") {
    hidden = true;
  } else if (state === "hidden") {
    hidden = false;
  }

  const params = {
    hidden: hidden,
  };

  api_func[CTFd.config.userMode](id, params).then((response) => {
    if (response.success) {
      if (hidden) {
        $btn.data("state", "hidden");
        $btn.addClass("btn-danger").removeClass("btn-success");
        $btn.text("Hidden");
      } else {
        $btn.data("state", "visible");
        $btn.addClass("btn-success").removeClass("btn-danger");
        $btn.text("Visible");
      }
    }
  });
}

function toggleSelectedAccounts(selectedAccounts, action) {
  const params = {
    hidden: action === "hidden" ? true : false,
  };
  const reqs = [];
  for (let accId of selectedAccounts.accounts) {
    reqs.push(api_func[CTFd.config.userMode](accId, params));
  }
  for (let accId of selectedAccounts.users) {
    reqs.push(api_func["users"](accId, params));
  }
  Promise.all(reqs).then((_responses) => {
    window.location.reload();
  });
}

function bulkToggleAccounts(_event) {
  // Get selected account and user IDs but only on the active tab.
  // Technically this could work for both tabs at the same time but that seems like
  // bad behavior. We don't want to accidentally unhide a user/team accidentally
  let accountIDs = $(".tab-pane.active input[data-account-id]:checked").map(
    function () {
      return $(this).data("account-id");
    },
  );

  let userIDs = $(".tab-pane.active input[data-user-id]:checked").map(
    function () {
      return $(this).data("user-id");
    },
  );

  let selectedUsers = {
    accounts: accountIDs,
    users: userIDs,
  };

  ezAlert({
    title: "Toggle Visibility",
    body: $(`
    <form id="scoreboard-bulk-edit">
      <div class="form-group">
        <label>Visibility</label>
        <select name="visibility" data-initial="">
          <option value="">--</option>
          <option value="visible">Visible</option>
          <option value="hidden">Hidden</option>
        </select>
      </div>
    </form>
    `),
    button: "Submit",
    success: function () {
      let data = $("#scoreboard-bulk-edit").serializeJSON(true);
      let state = data.visibility;
      toggleSelectedAccounts(selectedUsers, state);
    },
  });
}

function buildChart(targetId, data, title) {
  const target = document.getElementById(targetId);
  if (!target) return null;

  const option = {
    title: {
      left: "center",
      text: title,
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "cross" },
    },
    legend: {
      type: "scroll",
      orient: "horizontal",
      align: "left",
      bottom: 35,
      data: [],
    },
    toolbox: {
      feature: {
        dataZoom: { yAxisIndex: "none" },
        saveAsImage: {},
      },
    },
    grid: { containLabel: true },
    xAxis: [{ type: "time", boundaryGap: false, data: [] }],
    yAxis: [{ type: "value" }],
    dataZoom: [
      {
        id: "dataZoomX",
        type: "slider",
        xAxisIndex: [0],
        filterMode: "filter",
        height: 20,
        top: 35,
        fillerColor: "rgba(233, 236, 241, 0.4)",
      },
    ],
    series: [],
  };

  const entries = Object.keys(data);
  for (let i = 0; i < entries.length; i++) {
    const entry = data[entries[i]];
    const scores = [];
    const times = [];
    for (let j = 0; j < entry.solves.length; j++) {
      scores.push(entry.solves[j].value);
      times.push(dayjs(entry.solves[j].date).toDate());
    }
    const cumulative = cumulativeSum(scores);
    option.legend.data.push(entry.name);
    option.series.push({
      name: entry.name,
      type: "line",
      label: { normal: { position: "top" } },
      itemStyle: { normal: { color: colorHash(entry.name + entry.id) } },
      data: times.map((t, idx) => [t, cumulative[idx]]),
    });
  }

  const chart = echarts.init(target);
  chart.setOption(option, true);
  $(window).on("resize", () => chart && chart.resize());
  return chart;
}

async function loadChart(targetId, url, title) {
  try {
    const response = await CTFd.fetch(url, { method: "GET" });
    const json = await response.json();
    if (json.success) {
      buildChart(targetId, json.data, title);
    }
  } catch (e) {
    console.error("Failed to load scoreboard chart", e);
  }
}

$(() => {
  $(".scoreboard-toggle").click(toggleAccount);
  $("#scoreboard-edit-button").click(bulkToggleAccounts);

  const mode = CTFd.config.userMode;

  if (mode === "teams") {
    // Teams chart loads immediately (tab is active)
    loadChart("score-graph", "/api/v1/scoreboard/top/10", "Top 10 Teams");

    // Users chart loads when the Users tab is first shown
    let userChartLoaded = false;
    $('a[href="#user-standings"]').on("shown.bs.tab", function () {
      if (!userChartLoaded) {
        userChartLoaded = true;
        loadChart(
          "user-score-graph",
          "/api/v1/scoreboard/top/10?type=users",
          "Top 10 Users (Individual)",
        );
      }
    });
  } else {
    loadChart("score-graph", "/api/v1/scoreboard/top/10", "Top 10 Users");
  }
});
