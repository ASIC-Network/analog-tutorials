# Inverter: Schematic to Layout

This page walks through building a basic CMOS inverter in xschem, simulating it, and then laying it out in KLayout. By the end you'll have a working schematic, a passing DC/transient sim, and a DRC-clean layout ready for LVS.

## Overview

The inverter is the simplest CMOS logic gate and a good first exercise for the full analog flow: schematic capture in xschem, SPICE simulation with ngspice, and layout in KLayout. Working through it end-to-end will introduce you to PDK device symbols, sizing conventions (W/L ratios), and the basic layout rules you'll reuse in every later block.

## Prerequisites

- [IIC-OSIC-TOOLS](https://github.com/iic-jku/iic-osic-tools) container set up and running
- In this tutorial we'll be using the SKY130PDK

## Schematic

Open the terminal (it should auto be in the directory `/foss/designs`) and run:

```bash
sak-pdk SKY130A
xschem
```

1. Click the `+` symbol to open up a new schematic. You should now have a blank slate titled `untitled.sch`
2. Right click --> `Insert symbol` --> place an NMOS and PMOS device from the PDK symbol library, then `File -> Save as -> inverter.sch`
3. Wire the gates together as the input, and the drains together as the output. Tie the PMOS source to VDD and the NMOS source to VSS
   - `Ctrl + P` or `Symbol --> Place schematic input port`
   - `Ctrl + Shift + P` or `Symbol --> Place schematic output port`
   - Double click on a pin or press `q` to open its properties, and replace XXX with the pin name
4. Set device sizing (W/L) for the desired switching threshold. Here, we make PMOS 3x wider (so w=3) while NMOS w=1
5. Press `a` or `Symbol -> Make symbol from schematic` to create a symbol from the schematic

## Simulation

Open a new schematic (`inverter_tb.sch`), place your inverter symbol, and add a 1.8 V supply, a pulse source on the input, and a small load cap on the output. Netlisting it from xschem gives you something equivalent to the testbench below:

```spice
* inverter_tb.spice : DC sweep + transient, sky130 tt
.lib $PDK_ROOT/sky130A/libs.tech/ngspice/sky130.lib.spice tt

.subckt inverter IN OUT VDD VSS
XM1 OUT IN VSS VSS sky130_fd_pr__nfet_01v8 W=1 L=0.15
XM2 OUT IN VDD VDD sky130_fd_pr__pfet_01v8 W=3 L=0.15
.ends

Xinv in out vdd 0 inverter
Vdd vdd 0 1.8
Vin in 0 pulse(0 1.8 1n 50p 50p 2n 4n)
Cload out 0 10f

.control
dc Vin 0 1.8 0.01
meas dc vm find v(in) when v(out)=0.9
tran 10p 10n
meas tran trise trig v(out) val=0.18 rise=1 targ v(out) val=1.62 rise=1
meas tran tfall trig v(out) val=1.62 fall=1 targ v(out) val=0.18 fall=1
.endc
.end
```

Run it:

```bash
ngspice inverter_tb.spice
```

- `vm` is the switching threshold: where the DC transfer curve crosses VDD/2. With PMOS 3x wider it should sit close to mid-rail
- `trise` / `tfall` are the 10-90% output transition times into the 10 fF load

## Layout

```bash
pip show gdsfactory kfactory
pip install "gdsfactory<8"
```

Add `--break-system-packages` if pip refuses.

### Draw the cell

Open KLayout in edit mode (plain `klayout` opens as a viewer without editing perms):

```bash
klayout -e
```

1. `File -> New Layout`, select the `sky130A` technology, name the top cell `inverter`
2. Place the transistors: press `i` (Instance), pick the SKY130 PCell library, and place one `nfet_01v8` and one `pfet_01v8`. Double click each to set W/L matching the schematic (NMOS 1u/0.15u, PMOS 3u/0.15u)
3. Stack the PMOS above the NMOS with the gates aligned in a single vertical column. The PMOS PCell generates its own nwell; if you resize the device, make sure the well still encloses it
4. Add well taps: an n-tap inside the nwell tied to VDD, and a p-tap tied to VSS. The layout will *look* done without them, but it will fail LVS and the real circuit would be latch-up prone
5. Route the cell:
   - Gates: join the two poly gates, then drop a poly contact (licon needs npc over it) for the input
   - Drains: strap the NMOS and PMOS drains together on li1 for the output
   - Rails: met1 VDD rail across the top, VSS across the bottom, with mcon vias down to the sources and taps
6. Label the pins: place text labels `IN`, `OUT`, `VDD`, `VSS` on the pin purpose of the layer they land on. LVS matches ports by name, so these must match the schematic pins exactly
7. Export GDS: `File -> Save As -> inverter.gds`

### DRC

```bash
klayout -b -r $PDK_ROOT/sky130A/libs.tech/klayout/drc/sky130A_mr.drc \
  -rd input=inverter.gds -rd report=inverter_drc.lyrdb
```

Load the report in KLayout via `Tools -> Marker Browser` and fix violations until clean.

### LVS

Extract a SPICE netlist from the layout with Magic:

```bash
magic -dnull -noconsole -rcfile $PDK_ROOT/sky130A/libs.tech/magic/sky130A.magicrc
```

Then in the Magic console:

```tcl
gds read inverter.gds
load inverter
extract all
ext2spice lvs
ext2spice
```

Export the schematic netlist from xschem (Netlist button, make sure the top level is a `.subckt`) and save it as `inverter_sch.spice`. Then compare the two with netgen:

```bash
netgen -batch lvs "inverter.spice inverter" "inverter_sch.spice inverter" \
  $PDK_ROOT/sky130A/libs.tech/netgen/sky130A_setup.tcl
```

You want the final report to say the circuits match uniquely.

## Concluding

Once this works, try the [Ring Oscillator](ring-oscillator.md), which chains five of these inverters into a loop.

---

*Questions? Ask in the network Discord.*
