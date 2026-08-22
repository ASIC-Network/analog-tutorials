# analog-tutorials

Open documentation for analog IC design, built with [mdBook](https://rust-lang.github.io/mdBook/).

**This is still a work in progress.**

## Clone

`theme/` is a git submodule (shared with the rest of the network's docs
books — see [asic-network-docs/theme](../theme)):

```
git clone --recurse-submodules <this-repo-url>
# or, after a plain clone:
git submodule update --init
```

## Preview locally

```
mdbook serve
```

## Writing pages

One `src/*.md` file per page, listed in order in `src/SUMMARY.md`. Copy
`src/TEMPLATE.md` to start a new one — see the comment at the top of that
file for the authoring rules (linking, images, etc).

# To-do
* add an authors list section at the end of the pages so its easy for newer people to reach out to the right person if they are willing to contribute
