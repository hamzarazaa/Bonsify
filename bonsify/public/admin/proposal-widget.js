/* "Fetch from store" widget for the Proposals collection.
   The value saved is one JSON string (the fetched brand record). */
(function () {
  var h = window.h;
  var createClass = window.createClass;
  if (!h || !createClass || !window.CMS) return;

  function token() {
    try {
      var u = JSON.parse(localStorage.getItem("decap-cms-user") || localStorage.getItem("netlify-cms-user") || "{}");
      return u.token || "";
    } catch (e) { return ""; }
  }
  function parse(v) { try { return v ? JSON.parse(v) : null; } catch (e) { return null; } }

  var box = { border: "1px solid #dfdfe3", borderRadius: 6, padding: 14, background: "#fff" };
  var btn = { background: "#14171A", color: "#fff", border: 0, borderRadius: 4, padding: "9px 16px", fontWeight: 600, cursor: "pointer" };

  var Control = createClass({
    getInitialState: function () { return { url: "", busy: false, error: "" }; },
    set: function (brand) { this.props.onChange(brand ? JSON.stringify(brand) : ""); },
    fetchStore: function () {
      var self = this;
      if (!this.state.url.trim()) { this.setState({ error: "Paste the store address first." }); return; }
      this.setState({ busy: true, error: "" });
      fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token() },
        body: JSON.stringify({ url: this.state.url.trim() })
      }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (!res.ok) throw new Error(res.j.error || "Could not read that store.");
          self.set(res.j.brand);
          self.setState({ busy: false });
        }).catch(function (e) { self.setState({ busy: false, error: e.message }); });
    },
    removeProduct: function (i) {
      var b = parse(this.props.value); if (!b) return;
      b.products.splice(i, 1); this.set(b);
    },
    render: function () {
      var b = parse(this.props.value);
      var s = this.state;
      var kids = [
        h("div", { style: { display: "flex", gap: 8 } },
          h("input", { type: "text", placeholder: "https://brandstore.com", value: s.url,
            onChange: function (e) { this.setState({ url: e.target.value }); }.bind(this),
            style: { flex: 1, padding: "9px 10px", border: "1px solid #c8c8cf", borderRadius: 4 } }),
          h("button", { type: "button", style: btn, disabled: s.busy, onClick: this.fetchStore }, s.busy ? "Reading the store, about 20 seconds..." : (b ? "Fetch again" : "Fetch from store")))
      ];
      if (s.error) kids.push(h("p", { style: { color: "#b3261e", margin: "10px 0 0" } }, s.error));
      if (b) {
        kids.push(h("div", { style: { display: "flex", gap: 14, alignItems: "center", margin: "16px 0 8px" } },
          b.logo ? h("img", { src: b.logo, style: { height: 40, maxWidth: 140, objectFit: "contain", background: "#f4f4f4", padding: 4, borderRadius: 4 } }) : null,
          [b.colors && b.colors.primary, b.colors && b.colors.accent].filter(Boolean).map(function (c) {
            return h("span", { key: c, title: c, style: { width: 28, height: 28, borderRadius: 14, background: c, border: "1px solid #ccc", display: "inline-block" } });
          }),
          h("span", { style: { color: "#555" } }, (b.name || "") + " · " + (b.products || []).length + " products")));
        (b.warnings || []).forEach(function (w, i) { kids.push(h("p", { key: "w" + i, style: { color: "#8a5a00", margin: "4px 0" } }, "Note: " + w)); });
        kids.push(h("p", { style: { color: "#555", margin: "10px 0 6px" } }, "Remove any product you do not want to show:"));
        kids.push(h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(110px,1fr))", gap: 8 } },
          (b.products || []).map(function (p, i) {
            return h("div", { key: i, style: { border: "1px solid #e4e4e8", borderRadius: 4, padding: 6, fontSize: 12 } },
              h("img", { src: p.image, style: { width: "100%", height: 90, objectFit: "cover", borderRadius: 3 } }),
              h("div", { style: { margin: "4px 0", height: 30, overflow: "hidden" } }, p.title),
              h("button", { type: "button", onClick: function () { this.removeProduct(i); }.bind(this), style: { fontSize: 11, cursor: "pointer" } }, "Remove"));
          }, this)));
        var base = (this.props.field && this.props.field.get && this.props.field.get("page_base")) || "/for/";
        kids.push(h("p", { style: { color: "#555", marginTop: 12 } }, "The page will live at " + base + "<page address> after you Publish."));
      }
      return h("div", { style: box }, kids);
    }
  });

  var Preview = createClass({
    render: function () { return h("div", null, this.props.value ? "Store data fetched." : "Nothing fetched yet."); }
  });
  CMS.registerWidget("brandJson", Control, Preview);
})();
