# Inverter: Schematic to Layout

This page walks through building a basic CMOS inverter in xschem, simulating it, and then laying it out in KLayout. By the end you'll have a working schematic, a passing DC/transient sim, and a DRC-clean layout ready for LVS.

## Overview

The inverter is the simplest CMOS logic gate and a good first exercise for the full analog flow: schematic capture in xschem, SPICE simulation with ngspice, and layout in KLayout. Working through it end-to-end will introduce you to PDK device symbols, sizing conventions (W/L ratios), and the basic layout rules you'll reuse in every later block.

## Prerequisites

- [IIC-OSIC-TOOLS](https://github.com/iic-jku/iic-osic-tools) container set up and running
- In this tutorial we'll be using the SKY130PDK

## Steps

1. Open the terminal (it should auto be in the directory `/foss/designs`) and run the following:
```
sak-pdk SKY130A
xschem
```
2. Click the `+` symbol to open up a new schematic. You should now have a blank slate titled `untitled.sch`
3. Right click --> `Insert symbol` --> Place an NMOS and PMOS device from the PDK symbol library

`File -> Save as -> inverter.sch`

4. Wire the gates together as the input, and the drains together as the output. Tie the PMOS source to VDD and the NMOS source to VSS

`Ctrl + P` or `Symbol --> Place schematic input port`
`Ctrl + Shift + P` or `Symbol --> Place schematic output port`

Double click on pin or press `q` to open up properties. Change XXX with name.

5. Set device sizing (W/L) for the desired switching threshold. Here, we make PMOS 3x wider (so w=3) while NMOS w=1.

6. `a` or `symbol -> make symbol from schematic` to make a symbol from schematic. Open a new schematic again, place your symbol. or Run a DC sweep and transient simulation in ngspice to verify switching behavior
7. Export the schematic's layout view / open the corresponding cell in KLayout
8. Place and size the NMOS and PMOS layout devices
9. Route the input, output, VDD, and VSS connections
10. Run DRC to check the layout is rule-clean

```bash
# launch xschem with the sky130 PDK
xschem &

# after schematic is done, simulate with ngspice
ngspice inverter_tb.spice

# open the layout in klayout
klayout inverter.gds
```

## Results

| metric | value |
|--------|------:|
| switching threshold (V) | — |
| rise time (ns) | — |
| fall time (ns) | — |
| DRC violations | 0 |

## Checklist

- [ ] Schematic captures NMOS + PMOS with correct connectivity
- [ ] DC sweep shows correct switching behavior
- [ ] Transient sim shows clean rise/fall
- [ ] Layout matches schematic connectivity
- [ ] DRC clean